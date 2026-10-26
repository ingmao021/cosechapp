import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/*
 * Contrato con el backend (ver "Contrato de API" en wiki/Design_System.md):
 * estados en minúscula, montos en positivo (COP), fechas ISO. Un GET sin dato
 * responde 204 y HttpClient lo entrega como null.
 */

export interface OpenHarvestDto {
  name: string;
  pricePerKilogram: number;
}

/** Corrección de la cosecha activa; los campos sin enviar no cambian. */
export interface UpdateHarvestDto {
  name?: string;
  pricePerKilogram?: number;
}

/** crewId null = sin cuadrilla; harvestAlias null = quitar el alias de la cosecha. */
export interface UpdatePickerDto {
  crewId?: string | null;
  harvestAlias?: string | null;
}

export interface AssignWorkerDto {
  workerId: string;
  harvestAlias?: string;
  /** Cuadrilla destino; si el trabajador ya está en la cosecha, se le mueve a esta. */
  crewId?: string;
}

export interface CreateCrewDto {
  name: string;
}

export interface UpdateCrewDto {
  name: string;
}

export interface HarvestResponse {
  id: string;
  name: string;
  pricePerKilogram: number;
  status: 'active' | 'closed';
  openingDate: string;
  closingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Cosecha en la lista del historial: las cerradas traen su ganancia. */
export interface HarvestSummaryResponse extends HarvestResponse {
  actualProfit: number | null;
}

/** Recolector asignado a una cosecha (respuesta de asignar o archivar). */
export interface HarvestWorkerResponse {
  id: string;
  harvestId: string;
  workerId: string;
  harvestAlias: string | null;
  crewId: string | null;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

/** Recolector con nombre y acumulados, listo para mostrar (GET /harvests/:id/pickers). */
export interface PickerStatsResponse {
  id: string;
  harvestId: string;
  workerId: string;
  crewId: string | null;
  status: 'active' | 'archived';
  firstName: string;
  lastName: string;
  alias: string | null;
  displayName: string;
  todayKilograms: number;
  weekKilograms: number;
  totalKilograms: number;
  totalPaid: number;
  totalMealDeductions: number;
  balanceDue: number;
  createdAt: string;
  updatedAt: string;
}

export interface CrewResponse {
  id: string;
  harvestId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** Lo que se le paga a un recolector al cerrar (montos en positivo, COP). */
export interface SettlementLine {
  harvestPickerId: string;
  displayName: string;
  totalKilograms: number;
  gross: number;
  alreadyPaid: number;
  previousMealDeductions: number;
  pending: number;
  /** Días con pesadas desde su último pago (null si no hubo alimentación). */
  mealDays: number | null;
  mealDeduction: number;
  /** Efectivo que recibe al cierre. */
  net: number;
}

/** GET /harvests/:id/close-preview: liquidación de todos antes de cerrar. */
export interface ClosePreviewResponse {
  pickers: SettlementLine[];
  settledPickers: number;
  totalNet: number;
  totalMeals: number;
}

/** PATCH /harvests/:id/close: la cosecha cerrada y el resumen de lo que se pagó. */
export interface CloseHarvestResponse extends HarvestResponse {
  settlement: { settledPickers: number; totalNet: number; totalMeals: number };
}

/** Detalle de un trabajador en el historial: kilos por día, pagos y total. */
export interface PickerStatementResponse {
  pickerId: string;
  displayName: string;
  status: 'active' | 'archived';
  pricePerKilogram: number;
  days: Array<{ date: string; kilograms: number; amount: number }>;
  totalKilograms: number;
  gross: number;
  payments: Array<{ id: string; dateTime: string; amount: number; mealDeduction: number; isSettlement: boolean }>;
  totalPaid: number;
  totalMeals: number;
  total: number;
  balanceDue: number;
}

export interface HarvestDetailResponse {
  harvest: HarvestResponse;
  pickers: PickerStatsResponse[];
  crews: CrewResponse[];
  totalCherryKilograms: number;
  totalPayments: number;
  sale: {
    actualDryKilograms: number;
    salePrice: number;
    date: string;
    grossRevenue: number;
  } | null;
  costs: Array<{ id: string; description: string; amount: number; date: string }>;
  grossProfit: number;
  actualProfit: number;
}

/** Un movimiento de la cosecha para "Actividad reciente" en Inicio. Montos en positivo. */
export type HarvestActivityResponse =
  | { type: 'weighing'; id: string; pickerId: string; displayName: string; kilograms: number; dateTime: string }
  | {
      type: 'payment';
      id: string;
      pickerId: string;
      displayName: string;
      /** Efectivo recibido. */
      amount: number;
      mealDeduction: number;
      /** true: liquidación al cerrar; false: pago a quien se fue antes. */
      isSettlement: boolean;
      dateTime: string;
    };

/** GET /harvests/:id/dashboard: lo que Inicio no saca de los recolectores. */
export interface HarvestDashboardResponse {
  /** Hoy y los 6 días anteriores ("AAAA-MM-DD", hora de Colombia), del más antiguo a hoy; 0 sin pesadas. */
  dailyKilograms: Array<{ date: string; kilograms: number }>;
  /** Últimas pesadas y pagos, del más reciente al más antiguo. */
  recentActivity: HarvestActivityResponse[];
  /** Costos de producción, en positivo (con la cosecha abierta todavía no hay). */
  productionCosts: number;
}

/**
 * Servicio HTTP de cosechas: wrapper tipado sobre HarvestController.
 * Sin estado ni lógica de negocio.
 */
@Injectable({ providedIn: 'root' })
export class HarvestService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/harvests`;

  openHarvest(dto: OpenHarvestDto): Observable<HarvestResponse> {
    return this.http.post<HarvestResponse>(this.baseUrl, dto);
  }

  /** Cierra liquidando a todos; mealPerDay = comida por día que se le cobra a todos (null = sin). */
  closeHarvest(harvestId: string, mealPerDay: number | null): Observable<CloseHarvestResponse> {
    const body = mealPerDay === null ? { includesMeals: false } : { includesMeals: true, mealPerDay };
    return this.http.patch<CloseHarvestResponse>(`${this.baseUrl}/${harvestId}/close`, body);
  }

  closePreview(harvestId: string, mealPerDay: number | null): Observable<ClosePreviewResponse> {
    const params: Record<string, string> = { includesMeals: String(mealPerDay !== null) };
    if (mealPerDay !== null) params['mealPerDay'] = String(mealPerDay);
    return this.http.get<ClosePreviewResponse>(`${this.baseUrl}/${harvestId}/close-preview`, { params });
  }

  getPickerStatement(harvestId: string, pickerId: string): Observable<PickerStatementResponse> {
    return this.http.get<PickerStatementResponse>(`${this.baseUrl}/${harvestId}/pickers/${pickerId}/statement`);
  }

  /** 409 si se cambia el precio cuando ya hay pagos. */
  updateHarvest(harvestId: string, dto: UpdateHarvestDto): Observable<HarvestResponse> {
    return this.http.patch<HarvestResponse>(`${this.baseUrl}/${harvestId}`, dto);
  }

  /** 204; 409 si ya tiene pesadas o pagos (entonces se cierra). */
  deleteHarvest(harvestId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${harvestId}`);
  }

  /** null (204) cuando no hay cosecha activa. */
  getActiveHarvest(): Observable<HarvestResponse | null> {
    return this.http.get<HarvestResponse | null>(`${this.baseUrl}/active`);
  }

  getAllHarvests(): Observable<HarvestSummaryResponse[]> {
    return this.http.get<HarvestSummaryResponse[]>(this.baseUrl);
  }

  getHarvestById(harvestId: string): Observable<HarvestResponse> {
    return this.http.get<HarvestResponse>(`${this.baseUrl}/${harvestId}`);
  }

  getHarvestDetail(harvestId: string): Observable<HarvestDetailResponse> {
    return this.http.get<HarvestDetailResponse>(`${this.baseUrl}/${harvestId}/detail`);
  }

  getDashboard(harvestId: string): Observable<HarvestDashboardResponse> {
    return this.http.get<HarvestDashboardResponse>(`${this.baseUrl}/${harvestId}/dashboard`);
  }

  assignWorker(harvestId: string, dto: AssignWorkerDto): Observable<HarvestWorkerResponse> {
    return this.http.post<HarvestWorkerResponse>(`${this.baseUrl}/${harvestId}/pickers`, dto);
  }

  archiveWorker(harvestId: string, pickerId: string): Observable<HarvestWorkerResponse> {
    return this.http.patch<HarvestWorkerResponse>(`${this.baseUrl}/${harvestId}/pickers/${pickerId}/archive`, {});
  }

  updatePicker(harvestId: string, pickerId: string, dto: UpdatePickerDto): Observable<HarvestWorkerResponse> {
    return this.http.patch<HarvestWorkerResponse>(`${this.baseUrl}/${harvestId}/pickers/${pickerId}`, dto);
  }

  /** 204; 409 si ya tiene pesadas o pagos (entonces se archiva). */
  deletePicker(harvestId: string, pickerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${harvestId}/pickers/${pickerId}`);
  }

  getPickers(harvestId: string): Observable<PickerStatsResponse[]> {
    return this.http.get<PickerStatsResponse[]>(`${this.baseUrl}/${harvestId}/pickers`);
  }

  createCrew(harvestId: string, dto: CreateCrewDto): Observable<CrewResponse> {
    return this.http.post<CrewResponse>(`${this.baseUrl}/${harvestId}/crews`, dto);
  }

  listCrews(harvestId: string): Observable<CrewResponse[]> {
    return this.http.get<CrewResponse[]>(`${this.baseUrl}/${harvestId}/crews`);
  }

  updateCrew(harvestId: string, crewId: string, dto: UpdateCrewDto): Observable<CrewResponse> {
    return this.http.patch<CrewResponse>(`${this.baseUrl}/${harvestId}/crews/${crewId}`, dto);
  }

  /** 204 sin cuerpo. */
  deleteCrew(harvestId: string, crewId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${harvestId}/crews/${crewId}`);
  }
}
