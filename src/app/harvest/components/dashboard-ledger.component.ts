import { Component, inject } from '@angular/core';
import { DashboardFacade } from '../services/dashboard.facade';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';

/**
 * Organismo de Inicio: acumulado de la cosecha activa. Renglones nombre → cifra (montos sin
 * " COP", como en las listas, para que nombre y cifra quepan en un renglón) y, aparte,
 * las dos ganancias del PRD (bruta y de la cosecha), marcadas como estimadas: con la
 * cosecha abierta todavía no hay venta. Sin precio FNC no se inventa una cifra.
 */
@Component({
  selector: 'app-dashboard-ledger',
  standalone: true,
  imports: [CurrencyPipe, KilosPipe],
  template: `
    <dl class="ledger">
      <div class="row">
        <dt>Kilos recogidos</dt>
        <dd class="num">{{ dashboard.totalKilograms() | kilos }}</dd>
      </div>
      <div class="row">
        <dt>Pagado a recolectores</dt>
        <dd class="num">{{ dashboard.totalPaid() | currency: true : false }}</dd>
      </div>
      <div class="row">
        <dt>Por pagar</dt>
        <dd class="num">{{ dashboard.pendingTotal() | currency: true : false }}</dd>
      </div>
      <div class="row">
        <dt>Costos de producción</dt>
        @if (dashboard.productionCosts() > 0) {
          <dd class="num">{{ dashboard.productionCosts() | currency: true : false }}</dd>
        } @else {
          <dd class="pending">Se registran al cerrar</dd>
        }
      </div>
      <div class="row row--divider">
        <dt>Ganancia bruta <span class="tag">estimada</span></dt>
        @if (dashboard.estimatedGrossProfit() !== null) {
          <dd class="num" [class.loss]="dashboard.estimatedGrossProfit()! < 0">{{ dashboard.estimatedGrossProfit() | currency: true : false }}</dd>
        } @else {
          <dd class="pending">Sin precio FNC</dd>
        }
      </div>
      <div class="row row--total">
        <dt>Ganancia de la cosecha <span class="tag">estimada</span></dt>
        @if (dashboard.estimatedHarvestProfit() !== null) {
          <dd
            class="num profit"
            [class.gain]="dashboard.estimatedHarvestProfit()! > 0"
            [class.loss]="dashboard.estimatedHarvestProfit()! < 0"
          >{{ dashboard.estimatedHarvestProfit() | currency: true : false }}</dd>
        } @else {
          <dd class="pending">Sin precio FNC</dd>
        }
      </div>
    </dl>
    <p class="hint">
      Bruta: valor estimado − pagos a recolectores (pagado y por pagar). De la cosecha: bruta − costos.
      La real se calcula al registrar la venta.
    </p>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family-body);
    }
    .ledger {
      margin: 0;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 2px var(--spacing-md);
      padding: 6px 0;
    }
    dt {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    dd {
      margin: 0 0 0 auto;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      text-align: right;
    }
    dd.pending {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-regular);
      color: var(--color-text-muted);
    }
    .tag {
      display: inline-block;
      margin-left: 2px;
      padding: 1px 8px;
      border-radius: var(--radius-full);
      background: var(--color-surface-muted);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      vertical-align: 1px;
    }
    .row--divider {
      margin-top: 6px;
      padding-top: 12px;
      border-top: 1px solid var(--color-separator);
    }
    .row--total dt {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    /* Sin ganancia ni pérdida: color neutro, el verde se reserva para ganar (como en el historial). */
    .profit {
      font-family: var(--font-family-display);
      font-size: var(--font-size-title);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }
    .profit.gain {
      color: var(--color-primary-ink);
    }
    /* Pérdida estimada en rojo tierra (el signo "−" ya lo dice; el color acompaña). */
    dd.loss {
      color: var(--color-accent-alert);
    }
    .hint {
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
