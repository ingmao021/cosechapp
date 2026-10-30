import { Component, booleanAttribute, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

/**
 * Molécula: fila de navegación estilo sistema (Design System §2.6). Tile blanco con chip
 * de ícono (o iniciales), título, subtítulo opcional, dato al final y chevron.
 * Es el propio <button>, así el lector de pantalla lo anuncia como botón con su texto.
 * Uso:
 *   <button app-nav-row icon="people-outline" label="Catálogo de trabajadores" (click)="go()"></button>
 *   <button app-nav-row initials="JP" label="Juan Pérez" subtitle="3 recolectores">
 *     <span nav-row-end class="num">120 kg</span>
 *   </button>
 * El ícono lo registra la página que lo usa (addIcons), como con cualquier ion-icon.
 */
@Component({
  // Selector de atributo a propósito: el componente ES el <button> nativo (foco, disabled y
  // anuncio del lector de pantalla gratis), en vez de un elemento que envuelve a un botón.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[app-nav-row]',
  standalone: true,
  imports: [IonIcon],
  host: {
    type: 'button',
    class: 'tile tappable nav-row',
    '[class.nav-row--chevron]': 'chevron()',
  },
  template: `
    <span class="icon-chip" [class.icon-chip--initials]="initials()" aria-hidden="true">
      @if (initials()) {
        <span class="nav-row__initials">{{ initials() }}</span>
      } @else {
        <ion-icon [name]="icon()"></ion-icon>
      }
    </span>
    <span class="nav-row__text">
      <span class="nav-row__title">{{ label() }}</span>
      @if (subtitle()) {
        <span class="nav-row__subtitle">{{ subtitle() }}</span>
      }
      <ng-content></ng-content>
    </span>
    <ng-content select="[nav-row-end]"></ng-content>
    @if (chevron()) {
      <ion-icon name="chevron-forward" class="nav-row__chevron" aria-hidden="true"></ion-icon>
    }
  `,
  styles: [`
    /* Con letra grande en pantalla angosta, el dato del final (y el chevron) bajan a una
       segunda línea, alineados a la derecha, en vez de apretar el título: diseño apilado
       solo cuando no cabe (typography.md › Consider adjusting your layout at large font sizes). */
    :host {
      position: relative;
      flex-wrap: wrap;
      cursor: pointer;
    }
    /* El chevron va fijo a la derecha, centrado, con su espacio reservado: así nunca baja
       solo de línea; lo único que puede bajar es el dato del final. */
    :host(.nav-row--chevron) {
      padding-right: calc(var(--spacing-md) + 18px + var(--spacing-sm));
    }
    :host ::ng-deep [nav-row-end] {
      flex: 0 0 auto;
      margin-left: auto;
    }
    .nav-row__initials {
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.02em;
    }
    /* Título y subtítulo apilados con 2dp de aire; el texto se corta en dos líneas
       como máximo para que un nombre largo no rompa la fila. */
    /* La columna nunca baja de su palabra más larga (no parte "Caturra" en "Caturr/a"):
       si no cabe junto al dato del final, es el dato el que baja de línea. */
    .nav-row__text {
      display: flex;
      flex: 1 1 0;
      flex-direction: column;
      gap: 2px;
      min-width: min-content;
    }
    .nav-row__title {
      font-family: var(--font-family-body);
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      line-height: 1.3;
      overflow-wrap: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .nav-row__subtitle {
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-regular);
      color: var(--color-text-muted);
      line-height: 1.35;
      overflow-wrap: break-word;
    }
    /* El chevron se corre 2dp al tocar: indica hacia dónde lleva la fila. */
    .nav-row__chevron {
      position: absolute;
      top: 50%;
      right: var(--spacing-md);
      margin-top: -9px;
      font-size: 18px;
      color: var(--color-text-muted);
      transition: transform var(--dur-release) var(--ease-out);
    }
    :host(:active) .nav-row__chevron {
      transform: translateX(2px);
      transition-duration: var(--dur-press);
    }
    @media (prefers-reduced-motion: reduce) {
      :host(:active) .nav-row__chevron {
        transform: none;
      }
    }
  `],
})
export class NavRowComponent {
  icon = input<string>('');
  /** Iniciales en lugar del ícono (personas, cuadrillas). */
  initials = input<string>('');
  label = input.required<string>();
  subtitle = input<string>('');
  chevron = input(true, { transform: booleanAttribute });

  constructor() {
    addIcons({ chevronForward });
  }
}
