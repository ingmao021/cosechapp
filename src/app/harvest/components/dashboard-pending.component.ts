import { Component, computed, inject, output } from '@angular/core';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { DashboardFacade } from '../services/dashboard.facade';
import { NetworkService } from '../../network/services/network.service';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { initialsOf } from '../../shared/utils';

/** Filas antes de resumir el resto ("y N más"). */
const ROWS = 5;

/**
 * Organismo de Inicio: pagos pendientes a recolectores. Total por pagar y los saldos más
 * altos, cada uno con su atajo a "Pagar ahora" (emite `pay` con el id del recolector;
 * la página decide a dónde ir). Pagar requiere conexión.
 */
@Component({
  selector: 'app-dashboard-pending',
  standalone: true,
  imports: [IonButton, IonIcon, CurrencyPipe],
  template: `
    @if (dashboard.pendingPickers().length === 0) {
      <p class="note">
        <ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon>
        Nada pendiente: todos están al día.
      </p>
    } @else {
      <p class="headline">
        <span class="headline__label">
          Por pagar a {{ dashboard.pendingPickers().length }} {{ dashboard.pendingPickers().length === 1 ? 'recolector' : 'recolectores' }}
        </span>
        <span class="headline__value num">{{ dashboard.pendingTotal() | currency }}</span>
      </p>
      <ul class="people">
        @for (picker of shown(); track picker.id) {
          <li class="person">
            <span class="icon-chip person__initials" aria-hidden="true">{{ initials(picker.displayName) }}</span>
            <span class="person__text">
              <span class="person__name">{{ picker.displayName }}</span>
              <span class="person__amount num">{{ picker.balanceDue | currency: true : false }}</span>
            </span>
            @if (picker.status === 'active') {
              <ion-button
                fill="solid"
                class="pay-btn"
                [disabled]="!network.isOnline()"
                [attr.aria-label]="'Pagar ahora a ' + picker.displayName"
                (click)="pay.emit(picker.id)"
              >
                Pagar ahora
              </ion-button>
            } @else {
              <span class="person__note">Archivado</span>
            }
          </li>
        }
      </ul>
      @if (more() > 0) {
        <p class="hint">y {{ more() }} más</p>
      }
      <p class="hint">
        @if (network.isOnline()) {
          "Pagar ahora" es para quien se va antes. Al cerrar la cosecha se les paga a todos.
        } @else {
          Necesitas conexión para pagar.
        }
      </p>
    }
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family-body);
    }
    .note {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .note ion-icon {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--color-primary-ink);
    }
    .headline {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin: 0 0 var(--spacing-sm);
    }
    .headline__label {
      font-size: var(--font-size-footnote);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }
    .headline__value {
      font-family: var(--font-family-display);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      line-height: 1.1;
      color: var(--color-primary-ink);
      overflow-wrap: anywhere;
    }
    .people {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    /* Con letra grande, el botón baja a su propia línea en vez de apretar el nombre. */
    .person {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-sm) var(--row-gap);
      padding: 10px 0;
    }
    .person + .person {
      border-top: 1px solid var(--color-separator);
    }
    .person__initials {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
    }
    .person__text {
      display: flex;
      flex: 1 1 120px;
      flex-direction: column;
      min-width: 0;
    }
    .person__name {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      color: var(--color-text);
      overflow-wrap: anywhere;
    }
    .person__amount,
    .person__note {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    /* Tonal y sin borde: cinco botones con borde, uno por fila, hacían ruido. Sigue
       siendo un botón claro (verde suave, texto verde oscuro 5.2:1) de 44px de alto. */
    .pay-btn {
      --background: var(--color-primary-soft);
      --background-activated: var(--color-chip-pressed);
      --background-focused: var(--color-chip-pressed);
      --color: var(--color-primary-ink);
      --border-radius: var(--radius-full);
      --box-shadow: none;
      --padding-start: 14px;
      --padding-end: 14px;
      height: 44px;
      min-height: 44px;
      margin: 0 0 0 auto;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
    }
    .hint {
      margin: var(--spacing-sm) 0 0;
      font-size: var(--font-size-footnote);
      line-height: 1.4;
      color: var(--color-text-muted);
    }
  `],
})
export class DashboardPendingComponent {
  protected readonly dashboard = inject(DashboardFacade);
  protected readonly network = inject(NetworkService);

  /** Id del recolector a pagar. */
  readonly pay = output<string>();

  protected readonly initials = initialsOf;
  protected readonly shown = computed(() => this.dashboard.pendingPickers().slice(0, ROWS));
  protected readonly more = computed(() => Math.max(0, this.dashboard.pendingPickers().length - ROWS));

  constructor() {
    addIcons({ checkmarkCircleOutline });
  }
}
