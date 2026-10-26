import { Component, inject } from '@angular/core';
import { DashboardFacade } from '../services/dashboard.facade';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';

/**
 * Organismo de Inicio: la cuenta de la cosecha, como se haría en el cuaderno. Valor de lo
 * recogido − pagos a recolectores = ganancia bruta − costos = ganancia de la cosecha
 * (PRD 7.8 y 7.9). Con la cosecha abierta todavía no hay venta: el valor se estima con el
 * precio FNC de hoy, y sin precio no se inventa una cifra. Montos sin " COP", como en las
 * listas, para que nombre y cifra quepan en un renglón.
 */
@Component({
  selector: 'app-dashboard-ledger',
  standalone: true,
  imports: [CurrencyPipe, KilosPipe],
  template: `
    <div class="account">
      <div class="line">
        <span class="line__op"></span>
        <span class="line__name">Valor de lo recogido</span>
        @if (dashboard.estimatedValue() !== null) {
          <span class="line__value num">{{ dashboard.estimatedValue() | currency: true : false }}</span>
          <span class="line__detail">
            {{ dashboard.projectedDryKilograms() | kilos }} secos (cereza ÷ 5) ×
            <span class="nowrap">{{ dashboard.pricePerDryKilogram() | currency: true : false }}</span> por kg seco (FNC)
          </span>
        } @else {
          <span class="line__value line__value--muted">Sin precio FNC</span>
        }
      </div>

      <div class="line">
        <span class="line__op">−</span>
        <span class="line__name">Pagos a recolectores</span>
        <span class="line__value num">{{ dashboard.pickerPayments() | currency: true : false }}</span>
        <span class="line__detail">
          Pagado <span class="nowrap">{{ dashboard.totalPaid() | currency: true : false }}</span>
          + por pagar <span class="nowrap">{{ dashboard.pendingTotal() | currency: true : false }}</span>
        </span>
      </div>

      <div class="line line--subtotal">
        <span class="line__op">=</span>
        <span class="line__name">Ganancia bruta</span>
        @if (dashboard.estimatedGrossProfit() !== null) {
          <span class="line__value num" [class.loss]="dashboard.estimatedGrossProfit()! < 0">
            {{ dashboard.estimatedGrossProfit() | currency: true : false }}
          </span>
        } @else {
          <span class="line__value line__value--muted">—</span>
        }
      </div>

      <div class="line">
        <span class="line__op">−</span>
        <span class="line__name">Costos de producción</span>
        @if (dashboard.productionCosts() > 0) {
          <span class="line__value num">{{ dashboard.productionCosts() | currency: true : false }}</span>
        } @else {
          <span class="line__value line__value--muted">—</span>
          <span class="line__detail">Se registran al cerrar la cosecha</span>
        }
      </div>

      <div class="line line--total">
        <span class="line__op">=</span>
        <span class="line__name">Ganancia de la cosecha</span>
        @if (dashboard.estimatedHarvestProfit() !== null) {
          <span
            class="line__value num profit"
            [class.gain]="dashboard.estimatedHarvestProfit()! > 0"
            [class.loss]="dashboard.estimatedHarvestProfit()! < 0"
          >
            {{ dashboard.estimatedHarvestProfit() | currency: true : false }}
          </span>
        } @else {
          <span class="line__value line__value--muted">—</span>
        }
      </div>
    </div>
    <p class="foot">Estimado con el precio FNC de hoy. La ganancia real se calcula al registrar la venta.</p>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family-body);
    }
    /* Renglones de una cuenta: el signo en su propia columna, el nombre y la cifra a la
       derecha con dígitos de ancho fijo, para que las cantidades se lean alineadas. Si con
       letra grande no caben juntos, la cifra baja a su propia línea (nunca se parte una palabra). */
    .line {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: var(--spacing-sm);
      padding: 8px 0;
    }
    .line__op {
      flex: 0 0 16px;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
    }
    .line__name {
      flex: 1 1 8rem;
      min-width: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .line__value {
      margin-left: auto;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      text-align: right;
      white-space: nowrap;
    }
    .line__value--muted {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-regular);
      color: var(--color-text-muted);
    }
    .line__detail {
      flex-basis: 100%;
      margin-top: 2px;
      padding-left: calc(16px + var(--spacing-sm));
      font-size: var(--font-size-footnote);
      line-height: 1.35;
      color: var(--color-text-muted);
    }
    .nowrap {
      white-space: nowrap;
    }
    /* Cada "=" cierra un tramo de la cuenta con una raya, como al sumar en el cuaderno. */
    .line--subtotal,
    .line--total {
      border-top: 1px solid var(--color-separator);
    }
    .line--subtotal .line__name,
    .line--total .line__name {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    .line--total {
      margin-top: 4px;
      padding-top: 12px;
      border-top-width: 2px;
      border-top-color: rgba(29, 33, 27, 0.14);
    }
    .line--total .line__name {
      font-size: var(--font-size-md);
    }
    /* Sin ganancia ni pérdida: color neutro, el verde se reserva para ganar (como en el historial). */
    .profit {
      font-family: var(--font-family-display);
      font-size: var(--font-size-title);
      font-weight: var(--font-weight-bold);
    }
    .profit.gain {
      color: var(--color-primary-ink);
    }
    /* Pérdida estimada en rojo tierra (el signo "−" ya lo dice; el color acompaña). */
    .line__value.loss {
      color: var(--color-accent-alert);
    }
    .foot {
      margin: var(--spacing-sm) 0 0;
      font-size: var(--font-size-footnote);
      line-height: 1.4;
      color: var(--color-text-muted);
    }
  `],
})
export class DashboardLedgerComponent {
  protected readonly dashboard = inject(DashboardFacade);
}
