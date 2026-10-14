import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { HarvestService, PickerStatementResponse } from '../services/harvest.service';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { ListSkeletonComponent } from '@shared/components';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { apiErrorMessage } from '../../shared/utils';

/**
 * Detalle de un trabajador en el historial: kilos por día con su valor (kilos × precio),
 * comida descontada, pagos (si se fue antes o la liquidación al cierre) y total del trabajador.
 */
@Component({
  selector: 'app-picker-statement',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, CurrencyPipe, KilosPipe, DateFormatPipe, ListSkeletonComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/harvest/history/' + harvestId" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">{{ statement()?.displayName ?? 'Trabajador' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (loading()) {
        <app-list-skeleton [rows]="3" [avatar]="false"></app-list-skeleton>
      } @else if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      } @else if (statement(); as s) {
        <section class="card total-card">
          <span class="text-level-4">Total del trabajador</span>
          <strong class="total">{{ s.total | currency }}</strong>
          <span class="text-level-4">{{ s.totalKilograms | kilos }} × {{ s.pricePerKilogram | currency }} por kilo</span>
        </section>

        <section class="card">
          <h2 class="text-level-2">Kilos por día</h2>
          @if (s.days.length === 0) {
            <p class="text-level-4">No tiene pesadas.</p>
          } @else {
            <table class="days">
              <thead>
                <tr><th scope="col">Día</th><th scope="col">Kilos</th><th scope="col">Valor</th></tr>
              </thead>
              <tbody>
                @for (day of s.days; track day.date) {
                  <tr>
                    <td>{{ day.date + 'T12:00:00' | dateFormat: 'date' }}</td>
                    <td>{{ day.kilograms | kilos }}</td>
                    <td>{{ day.amount | currency }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr><th scope="row">Total</th><td>{{ s.totalKilograms | kilos }}</td><td>{{ s.gross | currency }}</td></tr>
              </tfoot>
            </table>
          }
        </section>

        <section class="card">
          <h2 class="text-level-2">Pagos</h2>
          @if (s.payments.length === 0) {
            <p class="text-level-4">No tiene pagos registrados.</p>
          } @else {
            <ul class="payments">
              @for (payment of s.payments; track payment.id) {
                <li>
                  <div>
                    <strong>{{ payment.isSettlement ? 'Liquidación al cerrar' : 'Pago (se fue antes)' }}</strong>
                    <span class="text-level-4">{{ payment.dateTime | dateFormat: 'date' }}</span>
                    @if (payment.mealDeduction > 0) {
                      <span class="text-level-4">Comida descontada: −{{ payment.mealDeduction | currency }}</span>
                    }
                  </div>
                  <strong>{{ payment.amount | currency }}</strong>
                </li>
              }
            </ul>
          }
          <dl class="summary">
            <div><dt>Kilos × precio</dt><dd>{{ s.gross | currency }}</dd></div>
            @if (s.totalMeals > 0) {
              <div><dt>Comida descontada</dt><dd>−{{ s.totalMeals | currency }}</dd></div>
            }
            <div><dt>Recibido en efectivo</dt><dd>{{ s.totalPaid | currency }}</dd></div>
            @if (s.balanceDue > 0) {
              <div class="due"><dt>Quedó debiendo</dt><dd>{{ s.balanceDue | currency }}</dd></div>
            }
          </dl>
        </section>
      }
    </ion-content>
  `,
  styles: [`
    .card {
      margin-bottom: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
      font-variant-numeric: tabular-nums;
    }
    .card h2 {
      margin: 0 0 var(--spacing-sm);
    }
    .total-card {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .total {
      font-family: var(--font-family-display);
      font-size: var(--font-size-xl);
      color: var(--color-primary);
      overflow-wrap: anywhere;
    }
    .days {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }
    .days th,
    .days td {
      padding: var(--spacing-xs) 0;
      text-align: right;
      border-bottom: 1px solid rgba(43, 36, 32, 0.08);
    }
    .days th:first-child,
    .days td:first-child {
      text-align: left;
    }
    .days tfoot th,
    .days tfoot td {
      font-weight: var(--font-weight-bold);
      border-bottom: none;
    }
    .payments {
      list-style: none;
      margin: 0 0 var(--spacing-sm);
      padding: 0;
    }
    .payments li {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-sm);
      padding: var(--spacing-xs) 0;
      border-bottom: 1px solid rgba(43, 36, 32, 0.08);
    }
    .payments li div {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .summary {
      margin: 0;
    }
    .summary div {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-sm);
      padding: 2px 0;
    }
    .summary dt,
    .summary dd {
      margin: 0;
    }
    .due {
      color: var(--ion-color-danger);
    }
  `],
})
export class PickerStatementPage {
  private readonly route = inject(ActivatedRoute);
  private readonly harvestService = inject(HarvestService);

  protected readonly harvestId = this.route.snapshot.paramMap.get('harvestId') ?? '';
  private readonly pickerId = this.route.snapshot.paramMap.get('pickerId') ?? '';

  readonly statement = signal<PickerStatementResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.statement.set(await firstValueFrom(this.harvestService.getPickerStatement(this.harvestId, this.pickerId)));
    } catch (err: unknown) {
      this.error.set(apiErrorMessage(err, 'No se pudo cargar el detalle del trabajador.'));
    } finally {
      this.loading.set(false);
    }
  }
}
