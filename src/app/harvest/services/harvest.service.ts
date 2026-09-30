import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// DTOs matching backend HarvestController
export interface OpenHarvestDto {
  name: string;
  pricePerKilogram: number;
}

export interface AssignWorkerDto {
  workerId: string;
  harvestAlias?: string;
}

export interface CreateCrewDto {
  name: string;
}

export interface UpdateCrewDto {
  name: string;
}

// Response interfaces matching backend responses
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

export interface HarvestDetailResponse {
  harvest: HarvestResponse;
  pickers: HarvestWorkerResponse[];
  crews: CrewResponse[];
  totalCherryKilograms: number;
  totalPayments: number;
  sale: {
    actualDryKilograms: number;
    salePrice: number;
    date: string;
    grossRevenue: number;
  } | null;
  costs: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
  }>;
  grossProfit: number;
  actualProfit: number;
}

export interface HarvestWorkerResponse {
  id: string;
  harvestId: string;
  workerId: string;
  harvestAlias: string | null;
  crewId: string | null;
  status: 'active' | 'archived';
  hasMeals: boolean;
  mealDetail: string | null;
  totalPaid: number;
  totalKilograms: number;
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

/**
 * Servicio HTTP para cosechas.
 * Wrapper tipado sobre los endpoints del HarvestController del backend.
 */
@Injectable({ providedIn: 'root' })
export class HarvestService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/harvests`;

  // Harvest CRUD
  openHarvest(dto: OpenHarvestDto): Observable<HarvestResponse> {
    return this.http.post<HarvestResponse>(this.baseUrl, dto);
  }

  closeHarvest(harvestId: string): Observable<HarvestResponse> {
    return this.http.patch<HarvestResponse>(`${this.baseUrl}/${harvestId}/close`, {});
  }

  getActiveHarvest(): Observable<HarvestResponse | null> {
    return this.http.get<HarvestResponse | null>(`${this.baseUrl}/active`);
  }

  getAllHarvests(): Observable<HarvestResponse[]> {
    return this.http.get<HarvestResponse[]>(this.baseUrl);
  }

  getHarvestById(harvestId: string): Observable<HarvestResponse | null> {
    return this.http.get<HarvestResponse | null>(`${this.baseUrl}/${harvestId}`);
  }

  getHarvestDetail(harvestId: string): Observable<HarvestDetailResponse | null> {
    return this.http.get<HarvestDetailResponse | null>(`${this.baseUrl}/${harvestId}/detail`);
  }

  // Pickers (trabajadores asignados a la cosecha)
  assignWorker(harvestId: string, dto: AssignWorkerDto): Observable<HarvestWorkerResponse> {
    return this.http.post<HarvestWorkerResponse>(`${this.baseUrl}/${harvestId}/pickers`, dto);
  }

  archiveWorker(harvestId: string, pickerId: string): Observable<HarvestWorkerResponse> {
    return this.http.patch<HarvestWorkerResponse>(`${this.baseUrl}/${harvestId}/pickers/${pickerId}/archive`, {});
  }

  getPickers(harvestId: string): Observable<HarvestWorkerResponse[]> {
    return this.http.get<HarvestWorkerResponse[]>(`${this.baseUrl}/${harvestId}/pickers`);
  }

  getActivePickers(harvestId: string): Observable<HarvestWorkerResponse[]> {
    return this.http.get<HarvestWorkerResponse[]>(`${this.baseUrl}/${harvestId}/pickers/active`);
  }

  // Crews (cuadrillas)
  createCrew(harvestId: string, dto: CreateCrewDto): Observable<CrewResponse> {
    return this.http.post<CrewResponse>(`${this.baseUrl}/${harvestId}/crews`, dto);
  }

  listCrews(harvestId: string): Observable<CrewResponse[]> {
    return this.http.get<CrewResponse[]>(`${this.baseUrl}/${harvestId}/crews`);
  }

  getCrew(harvestId: string, crewId: string): Observable<CrewResponse | null> {
    return this.http.get<CrewResponse | null>(`${this.baseUrl}/${harvestId}/crews/${crewId}`);
  }

  updateCrew(harvestId: string, crewId: string, dto: UpdateCrewDto): Observable<CrewResponse> {
    return this.http.patch<CrewResponse>(`${this.baseUrl}/${harvestId}/crews/${crewId}`, dto);
  }

  deleteCrew(harvestId: string, crewId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${harvestId}/crews/${crewId}`);
  }
}