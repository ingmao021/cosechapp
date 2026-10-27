import { Component, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { cashOutline, hourglassOutline, receiptOutline, scaleOutline } from 'ionicons/icons';
import { DashboardFacade } from '../services/dashboard.facade';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';

/**
 * Organismo de Inicio: el acumulado de la cosecha en cuatro celdas (kilos, pagado, por
 * pagar y costos), cada una con su ícono, para leerlas de un vistazo. Con letra grande
 * la cuadrícula pasa a una columna. La ganancia va aparte, en la cuenta.
 */
@Component({
  selector: 'app-dashboard-totals',
  standalone: true,
  imports: [IonIcon, CurrencyPipe, KilosPipe],
  template: `
    <ul class="metrics">
      <li class="metric">
        <span class="icon-chip" aria-hidden="true"><ion-icon name="scale-outline"></ion-icon></span>
        <span class="metric__label">Kilos recogidos</span>
        <span class="metric__value num">{{ dashboard.totalKilograms() | kilos: false }}<span class="unit"> kg</span></span>
      </li>
      <li class="metric">
        <span class="icon-chip" aria-hidden="true"><ion-icon name="cash-outline"></ion-icon></span>
        <span class="metric__label">Pagado</span>
        <span class="metric__value num">{{ dashboard.totalPaid() | currency: true : false }}</span>
      </li>
      <li class="metric">
        <span class="icon-chip" aria-hidden="true"><ion-icon name="hourglass-outline"></ion-icon></span>
        <span class="metric__label">Por pagar</span>
        <span class="metric__value num">{{ dashboard.pendingTotal() | currency: true : false }}</span>
      </li>
      <li class="metric">
        <span class="icon-chip" aria-hidden="true"><ion-icon name="receipt-outline"></ion-icon></span>
        @if (dashboard.productionCosts() > 0) {
          <span class="metric__label">Costos</span>
          <span class="metric__value num">{{ dashboard.productionCosts() | currency: true : false }}</span>
        } @else {
          <span class="metric__label">Costos · se registran al cerrar</span>
          <span class="metric__value metric__value--muted">—</span>
        }
      </li>
    </ul>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family-body);
    }
    .metrics {
      display: grid;
      padding: 0;
      list-style: none;
      /* En rem: con letra grande la columna mínima crece y la cuadrícula pasa a una sola
         columna, en vez de partir los montos a mitad de número. */
      grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
      gap: var(--spacing-sm);
      margin: 0;
    }
    /* Celda: ícono arriba, cifra en Zilla Slab y su nombre debajo. En el código el nombre
       va antes que la cifra, así el lector de pantalla dice "Pagado, $ 226.480". */
    .metric {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      padding: 14px var(--spacing-md);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    .icon-chip {
      --icon-chip-size: 32px;
      margin-bottom: 10px;
    }
    .icon-chip ion-icon {
      font-size: 18px;
    }
    .metric__value {
      font-family: var(--font-family-display);
      font-size: 1.375rem;
      font-weight: var(--font-weight-bold);
      line-height: 1.15;
      color: var(--color-text);
      overflow-wrap: break-word;
    }
    .metric__value--muted {
      color: var(--color-text-muted);
    }
    .metric__label {
      order: 1;
      font-size: var(--font-size-footnote);
      font-weight: var(--font-weight-medium);
      line-height: 1.3;
      color: var(--color-text-muted);
    }
    .unit {
      font-size: 0.7em;
    }
  `],
})
export class DashboardTotalsComponent {
  protected readonly dashboard = inject(DashboardFacade);

  constructor() {
    addIcons({ cashOutline, hourglassOutline, receiptOutline, scaleOutline });
  }
}
