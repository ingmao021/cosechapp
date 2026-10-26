import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';

/**
 * Molécula: estado vacío (Design System §2.6). Ícono de línea, título y, por
 * proyección, el texto de ayuda y la acción que resuelve el vacío.
 * Uso:
 *   <app-empty-state icon="people-outline" title="Sin recolectores">
 *     <p>Agrega recolectores del catálogo.</p>
 *     <ion-button>Agregar</ion-button>
 *   </app-empty-state>
 * El ícono lo registra la página que lo usa (addIcons), como con cualquier ion-icon.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IonIcon],
  template: `
    <div class="empty" [class.empty--flat]="flat()">
      <span class="empty__icon" aria-hidden="true"><ion-icon [name]="icon()"></ion-icon></span>
      <h2 class="empty__title">{{ title() }}</h2>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xl) var(--spacing-lg);
      text-align: center;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      animation: empty-in var(--dur-base) var(--ease-out);
    }
    .empty--flat {
      background: transparent;
      box-shadow: none;
      padding: var(--spacing-lg) var(--spacing-md);
    }
    /* El ícono va solo, sin círculo ni recuadro detrás: acompaña al título, no lo corona. */
    .empty__icon {
      display: flex;
      color: var(--color-secondary);
    }
    .empty__icon ion-icon {
      font-size: 44px;
    }
    .empty__title {
      margin: var(--spacing-xs) 0 0;
      font-family: var(--font-family-body);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      letter-spacing: -0.01em;
      color: var(--color-text);
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    :host ::ng-deep .empty > p {
      margin: 0;
      max-width: 32ch;
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      color: var(--color-text-muted);
      line-height: 1.45;
      overflow-wrap: anywhere;
    }
    :host ::ng-deep .empty > ion-button {
      margin-top: var(--spacing-sm);
    }
    @keyframes empty-in {
      from { opacity: 0; transform: translateY(6px); }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes empty-in {
        from { opacity: 0; }
      }
    }
  `],
})
export class EmptyStateComponent {
  icon = input.required<string>();
  title = input.required<string>();
  /** Sin tarjeta: para vacíos dentro de otra tarjeta o sección. */
  flat = input(false);
}
