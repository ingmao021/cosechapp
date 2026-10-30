import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WeighingService, WeighingResponse } from './weighing.service';
import { OfflineStore } from '../../sync/services/offline-store';
import { apiErrorMessage, colombiaDateKey, weekStartDateKey } from '../../shared/utils';

/** Copia en el teléfono de las pesadas de la semana de un recolector. */
const snapshotKey = (harvestPickerId: string) => `weighings:${harvestPickerId}`;
const thisWeek = () => weekStartDateKey(colombiaDateKey(new Date()));

/**
 * Facade de Pesadas: lista de pesadas de un recolector, incluidas las que están
 * en el teléfono esperando señal (marcadas como `pending`).
 * Los acumulados (hoy, semana, ciclo) vienen calculados en los recolectores de HarvestFacade.
 * Para registrar una pesada se usa SyncFacade.recordWeighing (funciona sin señal).
 * Sin señal usa la última copia de las pesadas de esta semana (las del gráfico).
 */
@Injectable({ providedIn: 'root' })
export class WeighingFacade {
  private readonly weighingService = inject(WeighingService);
  private readonly offlineStore = inject(OfflineStore);

  private readonly _pickerId = signal<string | null>(null);
  private readonly _weighings = signal<WeighingResponse[]>([]);
  private readonly _hasData = signal(false);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  /** Cambia cuando la cola local cambia, para recalcular `weighings`. */
  private readonly pendingTick = signal(0);

  /** Hay pesadas del servidor (o su copia de esta semana) para el recolector actual. */
  readonly hasData = this._hasData.asReadonly();
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

  /** Kilos por día de Colombia ("AAAA-MM-DD"), con las pendientes de enviar. */
  readonly kilogramsByDay = computed(() => {
    const byDay = new Map<string, number>();
    for (const weighing of this.weighings()) {
      const day = colombiaDateKey(weighing.dateTime);
      byDay.set(day, (byDay.get(day) ?? 0) + weighing.kilograms);
    }
    return byDay;
  });

  async loadWeighingsForPicker(harvestPickerId: string): Promise<void> {
    if (this._pickerId() !== harvestPickerId) {
      this._weighings.set([]);
      this._hasData.set(false);
    }
    this._pickerId.set(harvestPickerId);
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const weighings = await firstValueFrom(this.weighingService.getWeighingsByPicker(harvestPickerId));
      this._weighings.set(weighings);
      this._hasData.set(true);
      // Solo la semana: es lo que se muestra, y así la copia no crece con la cosecha.
      const monday = thisWeek();
      this.offlineStore.saveSnapshot(
        snapshotKey(harvestPickerId),
        weighings.filter((w) => colombiaDateKey(w.dateTime) >= monday),
      );
    } catch (err: unknown) {
      if ((err as { status?: number }).status !== 0) {
        this._error.set(apiErrorMessage(err, 'No se pudieron cargar las pesadas.'));
      } else if (!this._hasData()) {
        // Sin señal: la copia de esta semana, si la hay (una de otra semana no sirve).
        const snapshot = this.offlineStore.readSnapshot<WeighingResponse[]>(snapshotKey(harvestPickerId));
        if (snapshot && colombiaDateKey(snapshot.savedAt) >= thisWeek()) {
          this._weighings.set(snapshot.value);
          this._hasData.set(true);
        }
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
