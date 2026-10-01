import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HarvestService, HarvestSummaryResponse, HarvestDetailResponse } from './harvest.service';
import { apiErrorMessage } from '../../shared/utils';

/**
 * Facade de Historial de Cosechas — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - allHarvests: HarvestResponse[] (lista para historial)
 * - selectedHarvest: HarvestDetailResponse | null (detalle de una cosecha cerrada)
 * - isLoading: boolean
 * - error: string | null
 *
 * Métodos de acción:
 * - loadAllHarvests(): carga lista para historial
 * - loadHarvestDetail(harvestId): carga detalle completo de una cosecha cerrada
 * - clearSelectedHarvest(): limpia el detalle seleccionado
 *
 * Delega llamadas HTTP al HarvestService.
 */
@Injectable({ providedIn: 'root' })
export class HistoryFacade {
  private readonly harvestService = inject(HarvestService);

  // Estado privado (signals)
  private readonly _allHarvests = signal<HarvestSummaryResponse[]>([]);
  private readonly _selectedHarvest = signal<HarvestDetailResponse | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly allHarvests = this._allHarvests.asReadonly();
  readonly selectedHarvest = this._selectedHarvest.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  /** Historial = solo cosechas cerradas, la más reciente primero (Design System §1.9). */
  readonly closedHarvests = computed(() =>
    this._allHarvests()
      .filter((harvest) => harvest.status === 'closed')
      .sort((a, b) => (b.closingDate ?? '').localeCompare(a.closingDate ?? '')),
  );
  readonly hasHarvests = computed(() => this.closedHarvests().length > 0);

  /**
   * Carga todas las cosechas para el historial.
   */
  async loadAllHarvests(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      this._allHarvests.set(await firstValueFrom(this.harvestService.getAllHarvests()));
    } catch (err: any) {
      this._error.set(apiErrorMessage(err, 'Error al cargar historial de cosechas'));
      this._allHarvests.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Carga el detalle completo de una cosecha cerrada.
   */
  async loadHarvestDetail(harvestId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      this._selectedHarvest.set(await firstValueFrom(this.harvestService.getHarvestDetail(harvestId)));
    } catch (err: any) {
      this._error.set(apiErrorMessage(err, 'Error al cargar detalle de la cosecha'));
      this._selectedHarvest.set(null);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Limpia la cosecha seleccionada (al volver al historial).
   */
  clearSelectedHarvest(): void {
    this._selectedHarvest.set(null);
  }

  /**
   * Limpia el error actual.
   */
  clearError(): void {
    this._error.set(null);
  }
}