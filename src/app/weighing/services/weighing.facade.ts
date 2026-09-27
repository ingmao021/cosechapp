import { Injectable, signal, computed } from '@angular/core';
import { WeighingService, RecordWeighingDto, WeighingResponse, WeighingSummaryResponse } from './weighing.service';

/**
 * Facade de Pesadas — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - weighingsByPicker: WeighingResponse[] (pesadas de un recolector específico)
 * - todayWeighings: WeighingResponse[] (pesadas de hoy)
 * - weeklyKilos: number
 * - totalKilos: number
 * - isLoading: boolean
 * - error: string | null
 *
 * Métodos de acción:
 * - loadWeighingsForPicker(harvestPickerId)
 * - loadTodayWeighings(harvestPickerId)
 * - recordWeighing(dto)
 * - getWeeklyTotal(harvestPickerId)
 * - getTotalKilos(harvestPickerId)
 *
 * Delega llamadas HTTP al WeighingService.
 */
@Injectable({ providedIn: 'root' })
export class WeighingFacade {
  // Estado privado (signals)
  private readonly _weighings = signal<WeighingResponse[]>([]);
  private readonly _todayWeighings = signal<WeighingResponse[]>([]);
  private readonly _weeklyKilos = signal<number>(0);
  private readonly _totalKilos = signal<number>(0);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly weighings = this._weighings.asReadonly();
  readonly todayWeighings = this._todayWeighings.asReadonly();
  readonly weeklyKilos = this._weeklyKilos.asReadonly();
  readonly totalKilos = this._totalKilos.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly todayTotalKilos = computed(() =>
    this._todayWeighings().reduce((sum, w) => sum + w.kilograms, 0)
  );

  constructor(private readonly weighingService: WeighingService) {}

  /**
   * Carga todas las pesadas de un recolector.
   */
  async loadWeighingsForPicker(harvestPickerId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const weighings = await this.weighingService.getWeighingsByPicker(harvestPickerId).toPromise();
      this._weighings.set(weighings ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar pesadas');
      this._weighings.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Carga las pesadas de hoy para un recolector.
   */
  async loadTodayWeighings(harvestPickerId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const weighings = await this.weighingService.getWeighingsByPickerAndDateRange(
        harvestPickerId,
        today + 'T00:00:00',
        today + 'T23:59:59'
      ).toPromise();
      this._todayWeighings.set(weighings ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar pesadas de hoy');
      this._todayWeighings.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Registra una nueva pesada.
   */
  async recordWeighing(dto: RecordWeighingDto): Promise<WeighingResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const weighing = await this.weighingService.recordWeighing(dto).toPromise();
      if (weighing) {
        this._weighings.update(current => [...current, weighing]);
        return weighing;
      } else {
        throw new Error('Respuesta inválida al registrar pesada');
      }
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al registrar pesada');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Obtiene el total semanal de kilos.
   */
  async getWeeklyTotal(harvestPickerId: string): Promise<void> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const startDate = weekAgo.toISOString().split('T')[0] + 'T00:00:00';
    const endDate = new Date().toISOString().split('T')[0] + 'T23:59:59';

    try {
      const summary = await this.weighingService.getTotalKilogramsByPickerAndDateRange(
        harvestPickerId,
        startDate,
        endDate
      ).toPromise();
      this._weeklyKilos.set(summary?.totalKilograms ?? 0);
    } catch (err: any) {
      this._weeklyKilos.set(0);
    }
  }

  /**
   * Obtiene el total del ciclo completo.
   */
  async getTotalKilos(harvestPickerId: string): Promise<void> {
    try {
      const summary = await this.weighingService.getTotalKilogramsByPicker(harvestPickerId).toPromise();
      this._totalKilos.set(summary?.totalKilograms ?? 0);
    } catch (err: any) {
      this._totalKilos.set(0);
    }
  }

  /**
   * Limpia el error actual.
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Limpia el estado (útil al cambiar de recolector).
   */
  clearState(): void {
    this._weighings.set([]);
    this._todayWeighings.set([]);
    this._weeklyKilos.set(0);
    this._totalKilos.set(0);
    this._error.set(null);
  }
}