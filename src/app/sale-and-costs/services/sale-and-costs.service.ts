import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Contrato de SaleAndCostsController: montos en positivo (COP).
export interface RecordSaleDto {
  harvestId: string;
  actualDryKilograms: number;
  salePrice: number;
  date: string;
}

export interface AddProductionCostDto {
  harvestId: string;
  description: string;
  amount: number;
  date: string;
}

// Response interfaces matching backend responses
export interface SaleResponse {
  id: string;
  harvestId: string;
  actualDryKilograms: number;
  salePrice: number;
  date: string;
  grossRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionCostResponse {
  id: string;
  harvestId: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

/** Ganancia de una cosecha. Montos en positivo (COP). */
export interface ProfitResponse {
  harvestId: string;
  /** Kilos secos vendidos × precio. */
  grossRevenue: number;
  /** Total pagado a recolectores. */
  totalPickerPayments: number;
  /** Venta − pagos a recolectores. */
  grossProfit: number;
  totalProductionCosts: number;
  /** Ganancia de la cosecha: ganancia bruta − costos. */
  actualProfit: number;
  projectedDryKilograms: number;
  actualDryKilograms: number | null;
}

export interface DryKgProjectionResponse {
  cherryKilograms: number;
  projectedDryKilograms: number;
}

/**
 * Servicio HTTP para venta y costos.
 * Wrapper tipado sobre los endpoints del SaleAndCostsController del backend.
 */
@Injectable({ providedIn: 'root' })
export class SaleAndCostsService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/sale-and-costs`;

  /**
   * Registra la venta de una cosecha cerrada.
   */
  recordSale(dto: RecordSaleDto): Observable<{ sale: SaleResponse; grossProfit: number }> {
    return this.http.post<{ sale: SaleResponse; grossProfit: number }>(`${this.baseUrl}/sale`, dto);
  }

  /**
   * Agrega un costo de producción a una cosecha cerrada.
   */
  addProductionCost(dto: AddProductionCostDto): Observable<{ cost: ProductionCostResponse; actualProfit: number }> {
    return this.http.post<{ cost: ProductionCostResponse; actualProfit: number }>(`${this.baseUrl}/production-cost`, dto);
  }

  /**
   * Obtiene el cálculo de ganancia para una cosecha.
   */
  getHarvestProfit(harvestId: string): Observable<ProfitResponse> {
    return this.http.get<ProfitResponse>(`${this.baseUrl}/profit/${harvestId}`);
  }

  /**
   * Proyecta kilos secos a partir de kilos cereza (factor 1/5).
   */
  projectDryKilograms(cherryKilograms: number): Observable<DryKgProjectionResponse> {
    return this.http.get<DryKgProjectionResponse>(`${this.baseUrl}/project-dry-kg`, {
      params: { cherryKilograms: cherryKilograms.toString() }
    });
  }

  /**
   * Obtiene la venta registrada para una cosecha.
   */
  getSale(harvestId: string): Observable<SaleResponse | null> {
    return this.http.get<SaleResponse | null>(`${this.baseUrl}/sale/${harvestId}`);
  }

  /**
   * Obtiene los costos de producción de una cosecha.
   */
  getProductionCosts(harvestId: string): Observable<ProductionCostResponse[]> {
    return this.http.get<ProductionCostResponse[]>(`${this.baseUrl}/production-costs/${harvestId}`);
  }
}