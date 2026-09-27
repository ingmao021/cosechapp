import { Injectable, signal, computed } from '@angular/core';
import { PaymentService, PayNowDto, PaymentResponse, PaymentResponseItem, PaymentSummaryResponse } from './payment.service';

/**
 * Facade de Pagos — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - payments: PaymentResponseItem[] (historial de pagos de un recolector)
 * - totalPaid: number
 * - payNowResult: PaymentResponse | null (resultado del último "pagar ahora")
 * - isLoading: boolean
 * - error: string | null
 *
 * Métodos de acción:
 * - loadPaymentsForPicker(harvestPickerId)
 * - payNow(dto) - botón "Pagar ahora"
 * - getTotalPaid(harvestPickerId)
 *
 * Delega llamadas HTTP al PaymentService.
 */
@Injectable({ providedIn: 'root' })
export class PaymentFacade {
  // Estado privado (signals)
  private readonly _payments = signal<PaymentResponseItem[]>([]);
  private readonly _totalPaid = signal<number>(0);
  private readonly _payNowResult = signal<PaymentResponse | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly payments = this._payments.asReadonly();
  readonly totalPaid = this._totalPaid.asReadonly();
  readonly payNowResult = this._payNowResult.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly hasPayments = computed(() => this._payments().length > 0);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Carga el historial de pagos de un recolector.
   */
  async loadPaymentsForPicker(harvestPickerId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const payments = await this.paymentService.getPaymentsByPicker(harvestPickerId).toPromise();
      this._payments.set(payments ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar pagos');
      this._payments.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Ejecuta "Pagar ahora" - calcula y registra el pago.
   */
  async payNow(dto: PayNowDto): Promise<PaymentResponse> {
    this._isLoading.set(true);
    this._error.set(null);
    this._payNowResult.set(null);

    try {
      const result = await this.paymentService.payNow(dto).toPromise();
      if (result) {
        this._payNowResult.set(result);
        // Actualizar historial local
        await this.loadPaymentsForPicker(dto.harvestPickerId);
        return result;
      } else {
        throw new Error('Respuesta inválida al pagar');
      }
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al procesar pago');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Obtiene el total pagado a un recolector.
   */
  async getTotalPaid(harvestPickerId: string): Promise<void> {
    try {
      const summary = await this.paymentService.getTotalPaidByPicker(harvestPickerId).toPromise();
      this._totalPaid.set(summary?.totalPaid ?? 0);
    } catch (err: any) {
      this._totalPaid.set(0);
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
    this._payments.set([]);
    this._totalPaid.set(0);
    this._payNowResult.set(null);
    this._error.set(null);
  }
}