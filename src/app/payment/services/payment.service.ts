import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PayNowDto {
  harvestPickerId: string;
  harvestId: string;
  includesMeals: boolean;
  /** Lo que se cobra de alimentación por día (COP); el backend lo multiplica por los días con pesadas. */
  mealPerDay?: number;
}

/** Desglose de lo que se le pagaría ahora al recolector. Montos en positivo (COP). */
export interface PaymentPreviewResponse {
  totalKilograms: number;
  gross: number;
  alreadyPaid: number;
  previousMealDeductions: number;
  /** Alimentación de este pago: mealDays × mealPerDay. */
  mealDeduction: number;
  /** Días con pesadas desde el último pago (null si no hubo alimentación). */
  mealDays: number | null;
  mealPerDay: number | null;
  net: number;
}

/** Un pago hecho. `amount` es lo que recibió en efectivo, en positivo. */
export interface PaymentItemResponse {
  id: string;
  harvestPickerId: string;
  amount: number;
  includesMeals: boolean;
  mealDeduction: number;
  dateTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayNowResponse {
  payment: PaymentItemResponse;
  totalKilograms: number;
  amountDue: number;
}

/** Servicio HTTP de pagos: wrapper tipado sobre PaymentController. */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/payments`;

  preview(harvestPickerId: string, harvestId: string, mealPerDay: number | null): Observable<PaymentPreviewResponse> {
    const params: Record<string, string> = { harvestId, includesMeals: String(mealPerDay !== null) };
    if (mealPerDay !== null) params['mealPerDay'] = String(mealPerDay);
    return this.http.get<PaymentPreviewResponse>(`${this.baseUrl}/picker/${harvestPickerId}/preview`, { params });
  }

  payNow(dto: PayNowDto): Observable<PayNowResponse> {
    return this.http.post<PayNowResponse>(`${this.baseUrl}/pay-now`, dto);
  }

  getPaymentsByPicker(harvestPickerId: string): Observable<PaymentItemResponse[]> {
    return this.http.get<PaymentItemResponse[]>(`${this.baseUrl}/picker/${harvestPickerId}`);
  }
}
