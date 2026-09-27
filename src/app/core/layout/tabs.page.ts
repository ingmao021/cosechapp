import { Component } from '@angular/core';
import { IonTabs } from '@ionic/angular/ion-tabs';
import { IonTabBar } from '@ionic/angular/ion-tab-bar';
import { IonTabButton } from '@ionic/angular/ion-tab-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonLabel } from '@ionic/angular/ion-label';
import { addIcons } from 'ionicons';
import { homeOutline, pricetagOutline, timeOutline, personOutline } from 'ionicons/icons';

/**
 * Layout principal con barra de navegación inferior (4 tabs).
 * Estructura según Design System sección 3.1:
 * - Inicio (home)
 * - Precio y Noticias (pricetag)
 * - Historial (time)
 * - Perfil (person)
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom" class="tabs-bar">
        <ion-tab-button tab="home" href="/home">
          <ion-icon name="home-outline" aria-hidden="true"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="price-news" href="/price-news">
          <ion-icon name="pricetag-outline" aria-hidden="true"></ion-icon>
          <ion-label>Precio y Noticias</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="history" href="/history">
          <ion-icon name="time-outline" aria-hidden="true"></ion-icon>
          <ion-label>Historial</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/profile">
          <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    .tabs-bar {
      --height: var(--bottom-nav-height);
      --min-height: var(--bottom-nav-height);
      --background: var(--color-surface);
      --border-color: var(--color-border);
      --padding-bottom: env(safe-area-inset-bottom);
    }
    ion-tab-button {
      --color: var(--color-text-muted);
      --color-selected: var(--color-primary);
    }
    ion-icon {
      font-size: var(--bottom-nav-icon-size);
    }
    ion-label {
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-regular);
    }
  `],
})
export class TabsPage {
  constructor() {
    addIcons({ homeOutline, pricetagOutline, timeOutline, personOutline });
  }
}