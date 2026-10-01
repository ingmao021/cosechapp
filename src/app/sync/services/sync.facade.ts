import { Injectable, Injector, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NetworkService } from '../../network/services/network.service';
import { WeighingService, SyncItemResult } from '../../weighing/services/weighing.service';
import { WeighingFacade } from '../../weighing/services/weighing.facade';
import { HarvestFacade } from '../../harvest/services/harvest.facade';
import { OfflineStore, PendingWeighing, RejectedWeighing } from './offline-store';
import { apiErrorMessage } from '../../shared/utils';

export type RecordOutcome = 'sent' | 'queued';

/** Espera antes de reintentar tras un error de servidor: 5 s, 10 s, 20 s… hasta 5 min. */
const backoffMs = (attempts: number) => Math.min(5000 * 2 ** attempts, 5 * 60 * 1000);

/**
 * Pesadas sin señal (Design System §1.6).
 *
 * `recordWeighing` intenta enviar la pesada; si no hay conexión la guarda en el
 * teléfono y la suma a los acumulados en pantalla. La cola se envía sola al arrancar,
 * al recuperar la señal y tras cada pesada nueva. Cada pesada lleva un id generado
 * en el teléfono, así reenviarla nunca la duplica.
 */
@Injectable({ providedIn: 'root' })
export class SyncFacade {
  private readonly injector = inject(Injector);
  private readonly network = inject(NetworkService);
  private readonly weighingService = inject(WeighingService);
  private readonly offlineStore = inject(OfflineStore);

  private readonly _pendingCount = signal(0);
  private readonly _rejected = signal<RejectedWeighing[]>([]);
  private readonly _isSyncing = signal(false);
  private readonly _lastSync = signal<Date | null>(null);

  readonly pendingCount = this._pendingCount.asReadonly();
  /** Pesadas que el servidor rechazó: se muestran al usuario hasta que las descarte. */
  readonly rejected = this._rejected.asReadonly();
  readonly isSyncing = this._isSyncing.asReadonly();
  readonly lastSync = this._lastSync.asReadonly();

  private initialized = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /** Llamado una vez al arrancar la app (main.ts). */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.refreshCounts();

    // Al recuperar la señal (y al arrancar con señal), enviar lo pendiente.
    effect(
      () => {
        if (this.network.isOnline()) void this.syncAll();
      },
      { injector: this.injector },
    );
  }

  async recordWeighing(input: { harvestPickerId: string; kilograms: number }): Promise<RecordOutcome> {
    const weighing = {
      id: crypto.randomUUID(),
      harvestPickerId: input.harvestPickerId,
      kilograms: input.kilograms,
      dateTime: new Date().toISOString(),
    };

    if (this.network.isOnline() && this._pendingCount() === 0) {
      try {
        await firstValueFrom(this.weighingService.recordWeighing(weighing));
        return 'sent';
      } catch (err: unknown) {
        if (!isRetryable(err)) throw err; // rechazo real (422, 404…): el formulario lo muestra
      }
    }

    // Sin señal (o con pendientes por delante, para conservar el orden): a la cola.
    this.offlineStore.enqueueWeighing(weighing);
    this.harvestFacade().applyLocalWeighing(weighing.harvestPickerId, weighing.kilograms);
    this.refreshCounts();
    if (this.network.isOnline()) void this.syncAll();
    return 'queued';
  }

  /** Envía la cola. Una sola petición por lote; reintenta solo lo que falló por red o servidor. */
  async syncAll(): Promise<void> {
    const pending = this.offlineStore.pendingWeighings();
    if (this._isSyncing() || pending.length === 0) return;

    this._isSyncing.set(true);
    try {
      const results = await this.send(pending);
      this.applyResults(pending, results);
      this._lastSync.set(new Date());
      // Los acumulados del servidor ya incluyen lo enviado.
      const harvest = this.harvestFacade().activeHarvest();
      if (harvest) await this.harvestFacade().loadPickers(harvest.id);
    } catch {
      // Sin red o servidor caído: se reintenta más tarde.
      this.offlineStore.markAttempt(pending.map((w) => w.id));
      this.scheduleRetry();
    } finally {
      this._isSyncing.set(false);
      this.refreshCounts();
    }
  }

  dismissRejected(): void {
    this.offlineStore.clearRejected();
    this.refreshCounts();
  }

  private async send(pending: PendingWeighing[]): Promise<SyncItemResult[]> {
    const payload = pending.map(({ id, harvestPickerId, kilograms, dateTime }) => ({
      id,
      harvestPickerId,
      kilograms,
      dateTime,
    }));
    if (payload.length === 1) {
      try {
        await firstValueFrom(this.weighingService.recordWeighing(payload[0]));
        return [{ id: payload[0].id, status: 201 }];
      } catch (err: unknown) {
        if (isRetryable(err)) throw err;
        const status = (err as HttpErrorResponse).status;
        return [{ id: payload[0].id, status, message: apiErrorMessage(err) }];
      }
    }
    const response = await firstValueFrom(this.weighingService.syncWeighings(payload));
    return response.results;
  }

  private applyResults(pending: PendingWeighing[], results: SyncItemResult[]): void {
    const byId = new Map(pending.map((w) => [w.id, w]));
    const done = results.filter((r) => r.status < 300).map((r) => r.id);
    const retry = results.filter((r) => r.status >= 500).map((r) => r.id);
    const rejected = results
      .filter((r) => r.status >= 400 && r.status < 500)
      .map((r) => ({ ...byId.get(r.id)!, reason: rejectionReason(r) }));

    this.offlineStore.removePending([...done, ...rejected.map((r) => r.id)]);
    if (rejected.length) this.offlineStore.addRejected(rejected);
    if (retry.length) {
      this.offlineStore.markAttempt(retry);
      this.scheduleRetry();
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer) return;
    const attempts = Math.max(0, ...this.offlineStore.pendingWeighings().map((w) => w.attempts));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.network.isOnline()) void this.syncAll();
    }, backoffMs(attempts));
  }

  private refreshCounts(): void {
    this._pendingCount.set(this.offlineStore.pendingWeighings().length);
    this._rejected.set(this.offlineStore.rejectedWeighings());
    this.injector.get(WeighingFacade).refreshPending();
  }

  /** Perezoso: HarvestFacade no depende de SyncFacade, pero así evitamos ciclos al arrancar. */
  private harvestFacade(): HarvestFacade {
    return this.injector.get(HarvestFacade);
  }
}

/** Sin conexión (0) o error del servidor (5xx): vale la pena reintentar. */
function isRetryable(err: unknown): boolean {
  const status = err instanceof HttpErrorResponse ? err.status : 0;
  return status === 0 || status >= 500;
}

function rejectionReason(result: SyncItemResult): string {
  return apiErrorMessage(
    { status: result.status, error: { error: result.error } },
    result.status === 404 ? 'El recolector ya no existe en la cosecha.' : 'El servidor no aceptó esta pesada.',
  );
}
