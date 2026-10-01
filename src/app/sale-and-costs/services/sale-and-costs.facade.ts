import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SaleAndCostsService, RecordSaleDto, AddProductionCostDto, SaleResponse, ProductionCostResponse, ProfitResponse, DryKgProjectionResponse } from './sale-and-costs.service';
import { apiErrorMessage } from '../../shared/utils';

/**
 * Facade de Venta y Costos — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - sale: SaleResponse | null
 * - costs: ProductionCostResponse[]
 * - grossProfit: number
 * - actualProfit: number
 * - projectedDryKg: number
 * - isLoading: boolean
 * - error: string | null
 *
 * Métodos de acción:
 * - loadHarvestProfit(harvestId)
 * - recordSale(dto)
 * - addProductionCost(dto)
 * - projectDryKilograms(cherryKilograms)
 *
 * Delega llamadas HTTP al SaleAndCostsService.
 */
@Injectable({ providedIn: 'root' })
export class SaleAndCostsFacade {
  private readonly saleAndCostsService = inject(SaleAndCostsService);

  // Estado privado (signals)
  private readonly _profit = signal<ProfitResponse | null>(null);
  private readonly _sale = signal<SaleResponse | null>(null);
  private readonly _costs = signal<ProductionCostResponse[]>([]);
  private readonly _grossProfit = signal<number>(0);
  private readonly _actualProfit = signal<number>(0);
  private readonly _projectedDryKg = signal<number>(0);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly profit = this._profit.asReadonly();
  readonly sale = this._sale.asReadonly();
  readonly costs = this._costs.asReadonly();
  readonly grossProfit = this._grossProfit.asReadonly();
  readonly actualProfit = this._actualProfit.asReadonly();
  readonly projectedDryKg = this._projectedDryKg.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly hasSale = computed(() => this._sale() !== null);
  readonly totalCosts = computed(() => this._costs().reduce((sum, c) => sum + c.amount, 0));

  /** Venta, costos y ganancia de una cosecha. */
  async loadHarvestProfit(harvestId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const [profit, sale, costs] = await Promise.all([
        firstValueFrom(this.saleAndCostsService.getHarvestProfit(harvestId)),
        firstValueFrom(this.saleAndCostsService.getSale(harvestId)),
        firstValueFrom(this.saleAndCostsService.getProductionCosts(harvestId)),
      ]);
      this._profit.set(profit);
      this._sale.set(sale);
      this._costs.set(costs);
      this._grossProfit.set(profit.grossProfit);
      this._actualProfit.set(profit.actualProfit);
    } catch (err: unknown) {
      this._error.set(apiErrorMessage(err, 'No se pudo cargar la ganancia de la cosecha.'));
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Registra la venta de la cosecha.
   */
  async recordSale(dto: RecordSaleDto): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const result = await this.saleAndCostsService.recordSale(dto).toPromise();
      if (result) {
        this._sale.set(result.sale);
        this._grossProfit.set(result.grossProfit);
        await this.loadHarvestProfit(dto.harvestId);
      } else {
        throw new Error('Respuesta inválida al registrar venta');
      }
    } catch (err: any) {
      this._error.set(apiErrorMessage(err, 'Error al registrar venta'));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Agrega un costo de producción.
   */
  async addProductionCost(dto: AddProductionCostDto): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const result = await this.saleAndCostsService.addProductionCost(dto).toPromise();
      if (result) {
        this._costs.update(current => [...current, result.cost]);
        this._actualProfit.set(result.actualProfit);
        await this.loadHarvestProfit(dto.harvestId);
      } else {
        throw new Error('Respuesta inválida al agregar costo');
      }
    } catch (err: any) {
      this._error.set(apiErrorMessage(err, 'Error al agregar costo de producción'));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Proyecta kilos secos a partir de kilos cereza.
   */
  async projectDryKilograms(cherryKilograms: number): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const result = await this.saleAndCostsService.projectDryKilograms(cherryKilograms).toPromise();
      if (result) {
        this._projectedDryKg.set(result.projectedDryKilograms);
      }
    } catch (err: any) {
      this._error.set(apiErrorMessage(err, 'Error al proyectar kilos secos'));
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Limpia el error actual.
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Limpia todo el estado (útil al cambiar de cosecha).
   */
  clearState(): void {
    this._profit.set(null);
    this._sale.set(null);
    this._costs.set([]);
    this._grossProfit.set(0);
    this._actualProfit.set(0);
    this._projectedDryKg.set(0);
    this._error.set(null);
  }
}