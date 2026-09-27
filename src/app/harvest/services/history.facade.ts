import { Injectable, signal, computed } from '@angular/core';
import { HarvestService, HarvestResponse, HarvestDetailResponse } from './harvest.service';

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
  // Estado privado (signals)
  private readonly _allHarvests = signal<HarvestResponse[]>([]);
  private readonly _selectedHarvest = signal<HarvestDetailResponse | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly allHarvests = this._allHarvests.asReadonly();
  readonly selectedHarvest = this._selectedHarvest.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly hasHarvests = computed(() => this._allHarvests().length > 0);

  constructor(private readonly harvestService: HarvestService) {}

  /**
   * Carga todas las cosechas para el historial.
   */
  async loadAllHarvests(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const harvests = await this.harvestService.getAllHarvests().toPromise();
      this._allHarvests.set(harvests ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar historial de cosechas');
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
      const detail = await this.harvestService.getHarvestDetail(harvestId).toPromise();
      this._selectedHarvest.set(detail ?? null);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar detalle de la cosecha');
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