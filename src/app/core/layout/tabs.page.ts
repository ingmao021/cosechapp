import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs } from '@ionic/angular/ion-tabs';
import { IonTabBar } from '@ionic/angular/ion-tab-bar';
import { IonTabButton } from '@ionic/angular/ion-tab-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonLabel } from '@ionic/angular/ion-label';
import { addIcons } from 'ionicons';
import { add, home, homeOutline, pricetag, pricetagOutline, time, timeOutline, person, personOutline } from 'ionicons/icons';

/**
 * Layout principal con barra de navegación inferior flotante (Design System §3.1):
 * Inicio · Mercado · [Crear] · Historial · Perfil.
 * Crear es una sección más (/create: abrir cosecha o ver la abierta), con el botón
 * circular que sobresale de la barra. Su círculo siempre es verde; estar en ella se
 * anuncia con aria-current.
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs (ionTabsDidChange)="selected.set($event.tab)">
      <ion-tab-bar slot="bottom" class="tabs-bar">
        <ion-tab-button tab="home" href="/home">
          <ion-icon [name]="selected() === 'home' ? 'home' : 'home-outline'" aria-hidden="true"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="price-news" href="/price-news">
          <ion-icon [name]="selected() === 'price-news' ? 'pricetag' : 'pricetag-outline'" aria-hidden="true"></ion-icon>
          <ion-label>Mercado</ion-label>
        </ion-tab-button>

        <button
          type="button"
          class="tabs-create"
          aria-label="Crear"
          [attr.aria-current]="selected() === 'create' ? 'page' : null"
          (click)="create()"
        >
          <!-- El "bulto" del borde superior: hombros cóncavos que funden la barra con el botón. -->
          <svg class="tabs-create__bump" viewBox="0 0 120 26" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 26 C 30 26 34 0 60 0 C 86 0 90 26 120 26 Z" />
          </svg>
          <span class="tabs-create__fab" aria-hidden="true"><ion-icon name="add"></ion-icon></span>
          <span class="tabs-create__label" aria-hidden="true">Crear</span>
        </button>

        <ion-tab-button tab="history" href="/history">
          <ion-icon [name]="selected() === 'history' ? 'time' : 'time-outline'" aria-hidden="true"></ion-icon>
          <ion-label>Historial</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/profile">
          <ion-icon [name]="selected() === 'profile' ? 'person' : 'person-outline'" aria-hidden="true"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    /* Tarjeta flotante. Ionic pone contain: strict en la barra, que recortaría el bulto y
       el botón: se quita.
       La sombra es box-shadow, NO filter: drop-shadow sobre la barra entera: en el WebView
       de Android ese filtro, con los íconos cambiando de color al cambiar de pestaña, dejaba
       restos verdes sin repintar ("fantasmas" del ícono) por encima de la barra. El bulto
       tapa la sombra de la barra donde se cruzan y lleva su propia sombra, pequeña. */
    .tabs-bar {
      --background: var(--color-surface);
      --border: none;
      --color: var(--color-text-muted);
      --color-selected: var(--color-primary-ink);
      contain: none;
      overflow: visible;
      height: var(--bottom-nav-height);
      margin: 0 var(--spacing-sm) calc(var(--spacing-sm) + env(safe-area-inset-bottom, 0px));
      padding: 0;
      border-radius: var(--spacing-lg);
      box-shadow:
        0 0 0 0.5px rgba(29, 33, 27, 0.06),
        0 6px 16px rgba(29, 33, 27, 0.12);
    }
    /* Sin fondo propio: el de Ionic taparía las esquinas redondeadas de la barra. */
    ion-tab-button {
      --background: transparent;
      --background-focused: transparent;
      --ripple-color: transparent;
      --padding-start: 0;
      --padding-end: 0;
      min-width: 0;
      transition: color var(--dur-fast) var(--ease-out);
    }
    ion-tab-button ion-icon {
      font-size: var(--bottom-nav-icon-size);
    }
    ion-label {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      letter-spacing: -0.01em;
    }
    .tab-selected ion-label {
      font-weight: var(--font-weight-semibold);
    }

    /* Crear: misma columna que una pestaña (hueco del ícono + etiqueta) para que
       "Crear" quede alineada con las demás etiquetas; el círculo flota encima. */
    .tabs-create {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-width: 0;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      color: var(--color-primary-ink);
      font: inherit;
      cursor: pointer;
    }
    .tabs-create::before {
      content: '';
      display: block;
      height: 32px; /* 6 + 24 + 2: ícono de una pestaña md con sus márgenes */
    }
    .tabs-create__bump {
      position: absolute;
      top: -25px;
      left: 50%;
      width: 120px;
      height: 26px;
      transform: translateX(-50%);
      fill: var(--color-surface);
      pointer-events: none;
      /* Sombra propia, solo hacia arriba: es un elemento pequeño y fijo (no cambia al
         cambiar de pestaña), así que el filtro aquí no deja restos. */
      filter: drop-shadow(0 -2px 3px rgba(29, 33, 27, 0.06));
    }
    .tabs-create__fab {
      position: absolute;
      top: -16px;
      left: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      margin-left: -26px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      box-shadow: 0 4px 14px rgba(var(--ion-color-primary-rgb), 0.45);
      transition: transform var(--dur-press) var(--ease-out);
    }
    .tabs-create__fab ion-icon {
      font-size: 30px;
    }
    .tabs-create:active .tabs-create__fab {
      transform: scale(0.94);
    }
    .tabs-create__label {
      margin-bottom: 6px;
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      line-height: 1.1;
    }
    .tabs-create:focus-visible {
      outline: none;
    }
    .tabs-create:focus-visible .tabs-create__fab {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 3px;
    }
    @media (prefers-reduced-motion: reduce) {
      .tabs-create:active .tabs-create__fab {
        transform: none;
        opacity: 0.85;
      }
    }
  `],
})
export class TabsPage {
  private readonly router = inject(Router);

  /** Pestaña activa: su ícono pasa a relleno, como en las apps nativas. */
  protected readonly selected = signal('home');

  constructor() {
    addIcons({ add, home, homeOutline, pricetag, pricetagOutline, time, timeOutline, person, personOutline });
  }

  /** La sección Crear decide qué mostrar: el formulario o la cosecha que ya está abierta. */
  create(): void {
    void this.router.navigate(['/create']);
  }
}
