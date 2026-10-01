import { Injectable, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PaymentService, PaymentItemResponse, PaymentPreviewResponse, PayNowResponse } from './payment.service';
import { apiErrorMessage } from '../../shared/utils';

/**
 * Facade de Pagos: historial de pagos de un recolector, desglose antes de pagar y pago.
 * Pagar requiere conexión: con datos desactualizados se podría pagar dos veces.
 */
@Injectable({ providedIn: 'root' })
export class PaymentFacade {
  private readonly paymentService = inject(PaymentService);

  private readonly _payments = signal<PaymentItemResponse[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly payments = this._payments.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadPaymentsForPicker(harvestPickerId: string): Promise<void> {
    this._error.set(null);
    try {
      this._payments.set(await firstValueFrom(this.paymentService.getPaymentsByPicker(harvestPickerId)));
    } catch (err: unknown) {
      this._payments.set([]);
      if ((err as { status?: number }).status !== 0) {
        this._error.set(apiErrorMessage(err, 'No se pudieron cargar los pagos.'));
      }
    }
  }

  /** Desglose (bruto, ya pagado, alimentación, neto). Lanza el error de la API (ej. 422 nada pendiente). */
  preview(harvestPickerId: string, harvestId: string, mealDeduction: number | null): Promise<PaymentPreviewResponse> {
    return firstValueFrom(this.paymentService.preview(harvestPickerId, harvestId, mealDeduction));
  }

  async payNow(harvestPickerId: string, harvestId: string, mealDeduction: number | null): Promise<PayNowResponse> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const result = await firstValueFrom(
        this.paymentService.payNow({
          harvestPickerId,
          harvestId,
          includesMeals: mealDeduction !== null,
          mealDeduction: mealDeduction ?? undefined,
        }),
      );
      this._payments.update((payments) => [result.payment, ...payments]);
      return result;
    } catch (err: unknown) {
      this._error.set(apiErrorMessage(err, 'No se pudo registrar el pago.'));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }
}
