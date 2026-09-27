import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// DTOs matching backend WeighingController
export interface RecordWeighingDto {
  harvestPickerId: string;
  kilograms: number;
  dateTime?: string;
}

export interface WeighingResponse {
  id: string;
  harvestPickerId: string;
  kilograms: number;
  dateTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeighingSummaryResponse {
  harvestPickerId: string;
  totalKilograms: number;
}

/**
 * Servicio HTTP para pesadas.
 * Wrapper tipado sobre los endpoints del WeighingController del backend.
 */
@Injectable({ providedIn: 'root' })
export class WeighingService {
  private readonly baseUrl = `${environment.apiUrl}/weighings`;

  constructor(private readonly http: HttpClient) {}

  recordWeighing(dto: RecordWeighingDto): Observable<WeighingResponse> {
    return this.http.post<WeighingResponse>(this.baseUrl, dto);
  }

  getWeighingsByPicker(harvestPickerId: string): Observable<WeighingResponse[]> {
    return this.http.get<WeighingResponse[]>(`${this.baseUrl}/picker/${harvestPickerId}`);
  }

  getWeighingsByPickerAndDateRange(harvestPickerId: string, startDate: string, endDate: string): Observable<WeighingResponse[]> {
    return this.http.get<WeighingResponse[]>(`${this.baseUrl}/picker/${harvestPickerId}/range`, {
      params: { startDate, endDate }
    });
  }

  getTotalKilogramsByPicker(harvestPickerId: string): Observable<WeighingSummaryResponse> {
    return this.http.get<WeighingSummaryResponse>(`${this.baseUrl}/picker/${harvestPickerId}/total`);
  }

  getTotalKilogramsByPickerAndDateRange(harvestPickerId: string, startDate: string, endDate: string): Observable<WeighingSummaryResponse> {
    return this.http.get<WeighingSummaryResponse>(`${this.baseUrl}/picker/${harvestPickerId}/total/range`, {
      params: { startDate, endDate }
    });
  }
}