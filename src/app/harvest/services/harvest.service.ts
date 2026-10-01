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

  closeHarvest(harvestId: string): Observable<HarvestResponse> {
    return this.http.patch<HarvestResponse>(`${this.baseUrl}/${harvestId}/close`, {});
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

  assignWorker(harvestId: string, dto: AssignWorkerDto): Observable<HarvestWorkerResponse> {
    return this.http.post<HarvestWorkerResponse>(`${this.baseUrl}/${harvestId}/pickers`, dto);
  }

  archiveWorker(harvestId: string, pickerId: string): Observable<HarvestWorkerResponse> {
    return this.http.patch<HarvestWorkerResponse>(`${this.baseUrl}/${harvestId}/pickers/${pickerId}/archive`, {});
  }

  getPickers(harvestId: string): Observable<PickerStatsResponse[]> {
    return this.http.get<PickerStatsResponse[]>(`${this.baseUrl}/${harvestId}/pickers`);
  }

  getActivePickers(harvestId: string): Observable<PickerStatsResponse[]> {
    return this.http.get<PickerStatsResponse[]>(`${this.baseUrl}/${harvestId}/pickers/active`);
  }

  createCrew(harvestId: string, dto: CreateCrewDto): Observable<CrewResponse> {
    return this.http.post<CrewResponse>(`${this.baseUrl}/${harvestId}/crews`, dto);
  }

  listCrews(harvestId: string): Observable<CrewResponse[]> {
    return this.http.get<CrewResponse[]>(`${this.baseUrl}/${harvestId}/crews`);
  }

  getCrew(harvestId: string, crewId: string): Observable<CrewResponse> {
    return this.http.get<CrewResponse>(`${this.baseUrl}/${harvestId}/crews/${crewId}`);
  }

  updateCrew(harvestId: string, crewId: string, dto: UpdateCrewDto): Observable<CrewResponse> {
    return this.http.patch<CrewResponse>(`${this.baseUrl}/${harvestId}/crews/${crewId}`, dto);
  }

  /** 204 sin cuerpo. */
  deleteCrew(harvestId: string, crewId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${harvestId}/crews/${crewId}`);
  }
}
