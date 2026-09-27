import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// DTOs matching backend PaymentController
export interface PayNowDto {
  harvestPickerId: string;
  harvestId: string;
  includesMeals: boolean;
  mealDetail?: string;
}

export interface PaymentResponse {
  payment: {
    id: string;
    harvestPickerId: string;
    amount: number;
    includesMeals: boolean;
    mealDetail: string | null;
    dateTime: string;
    createdAt: string;
    updatedAt: string;
  };
  totalKilograms: number;
  amountDue: number;
}

export interface PaymentSummaryResponse {
  harvestPickerId: string;
  totalPaid: number;
}

export interface PaymentResponseItem {
  id: string;
  harvestPickerId: string;
  amount: number;
  includesMeals: boolean;
  mealDetail: string | null;
  dateTime: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio HTTP para pagos.
 * Wrapper tipado sobre los endpoints del PaymentController del backend.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  constructor(private readonly http: HttpClient) {}

  payNow(dto: PayNowDto): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/pay-now`, dto);
  }

  getPaymentsByPicker(harvestPickerId: string): Observable<PaymentResponseItem[]> {
    return this.http.get<PaymentResponseItem[]>(`${this.baseUrl}/picker/${harvestPickerId}`);
  }

  getTotalPaidByPicker(harvestPickerId: string): Observable<PaymentSummaryResponse> {
    return this.http.get<PaymentSummaryResponse>(`${this.baseUrl}/picker/${harvestPickerId}/total`);
  }
}