import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WeighingService, WeighingResponse } from './weighing.service';
import { OfflineStore } from '../../sync/services/offline-store';
import { apiErrorMessage } from '../../shared/utils';

const isSameLocalDay = (iso: string, now = new Date()) => new Date(iso).toDateString() === now.toDateString();

/**
 * Facade de Pesadas: lista de pesadas de un recolector, incluidas las que están
 * en el teléfono esperando señal (marcadas como `pending`).
 * Los acumulados (hoy, semana, ciclo) vienen calculados en los recolectores de HarvestFacade.
 * Para registrar una pesada se usa SyncFacade.recordWeighing (funciona sin señal).
 */
@Injectable({ providedIn: 'root' })
export class WeighingFacade {
  private readonly weighingService = inject(WeighingService);
  private readonly offlineStore = inject(OfflineStore);

  private readonly _pickerId = signal<string | null>(null);
  private readonly _weighings = signal<WeighingResponse[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  /** Cambia cuando la cola local cambia, para recalcular `weighings`. */
  private readonly pendingTick = signal(0);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Pesadas del recolector actual, más recientes primero; las pendientes de enviar incluidas. */
  readonly weighings = computed<Array<WeighingResponse & { pending: boolean }>>(() => {
    const pickerId = this._pickerId();
    const sent = this._weighings().map((w) => ({ ...w, pending: false }));
    const sentIds = new Set(sent.map((w) => w.id));
    const pending = this.pendingTick() >= 0
      ? this.offlineStore
          .pendingWeighings()
          .filter((w) => w.harvestPickerId === pickerId && !sentIds.has(w.id))
          .map((w) => ({ ...w, createdAt: w.dateTime, updatedAt: w.dateTime, pending: true }))
      : [];
    return [...pending, ...sent].sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  });

  readonly todayWeighings = computed(() => this.weighings().filter((w) => isSameLocalDay(w.dateTime)));

  async loadWeighingsForPicker(harvestPickerId: string): Promise<void> {
    if (this._pickerId() !== harvestPickerId) this._weighings.set([]);
    this._pickerId.set(harvestPickerId);
    this._isLoading.set(true);
    this._error.set(null);
    try {
      this._weighings.set(await firstValueFrom(this.weighingService.getWeighingsByPicker(harvestPickerId)));
    } catch (err: unknown) {
      // Sin señal se muestran solo las pendientes guardadas en el teléfono.
      if ((err as { status?: number }).status !== 0) {
        this._error.set(apiErrorMessage(err, 'No se pudieron cargar las pesadas.'));
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Avisar que la cola local cambió (SyncFacade lo llama al encolar o sincronizar). */
  refreshPending(): void {
    this.pendingTick.update((tick) => tick + 1);
  }
}
