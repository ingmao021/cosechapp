import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonRefresher } from '@ionic/angular/ion-refresher';
import { IonRefresherContent } from '@ionic/angular/ion-refresher-content';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonChip } from '@ionic/angular/ion-chip';
import { IonLabel } from '@ionic/angular/ion-label';
import { addIcons } from 'ionicons';
import { pricetagOutline, newspaperOutline, refreshOutline } from 'ionicons/icons';

/**
 * Pestaña "Precio y Noticias" — Placeholder para Tarea 6.1.
 * Contenido según Design System 1.10:
 * - Precio actual FNC (valor grande, Zilla Slab, fecha)
 * - Lista de noticias (news-card molecule)
 * - Pull-to-refresh
 */
@Component({
  selector: 'app-price-news',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonChip, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Precio y Noticias</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content pulling-icon="refresh-outline"></ion-refresher-content>
      </ion-refresher>

      <!-- Precio FNC actual -->
      <ion-card class="fnc-price-card">
        <ion-card-content class="text-center">
          <div class="price-value">\$ 2.450</div>
          <div class="price-meta text-level-4">Actualizado: 26 sep 2026</div>
          <ion-chip color="medium" class="ion-margin-top source-chip">
            <ion-label>Fuente: FNC (cache offline)</ion-label>
          </ion-chip>
        </ion-card-content>
      </ion-card>

      <!-- Noticias -->
      <div class="news-section">
        <h2 class="text-level-2 ion-padding-horizontal ion-margin-bottom">Noticias y Tips</h2>

        <ion-card class="news-card" *ngFor="let news of mockNews">
          <ion-card-content>
            <ion-card-header>
              <ion-card-title class="text-level-3">{{ news.title }}</ion-card-title>
              <ion-card-subtitle class="text-level-4">{{ news.source }} • {{ news.date }}</ion-card-subtitle>
            </ion-card-header>
            <p class="text-level-4 ion-margin-top">{{ news.summary }}</p>
            <ion-button fill="clear" color="primary" size="small" class="ion-margin-top">
              <ion-icon name="open-outline" slot="end"></ion-icon>
              Leer más
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .fnc-price-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin: var(--spacing-md);
      background: linear-gradient(135deg, var(--color-primary) 0%, #2a4d18 100%);
      color: var(--color-text-on-primary);
    }
    .price-value {
      font-family: var(--font-family-display);
      font-size: 48sp;
      font-weight: var(--font-weight-bold);
      line-height: 1.1;
    }
    .price-meta {
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      opacity: 0.9;
    }
    .source-chip {
      --background: rgba(255,255,255,0.2);
      --color: var(--color-text-on-primary);
    }
    .news-section {
      padding: 0 var(--spacing-md) var(--spacing-xl);
    }
    .news-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--card-gap-vertical);
    }
    .text-center {
      text-align: center;
    }
  `],
})
export class PriceNewsPage {
  mockNews = [
    { title: 'Café sube 50 pesos por carga en nueva cotización FNC', source: 'FNC', date: '26 sep 2026', summary: 'El precio de referencia para la carga de 125 kg alcanzó los $2.450.000...' },
    { title: 'Recomendaciones para control de broca en cafetales de Nariño', source: 'Cenicafé', date: '24 sep 2026', summary: 'Avances Técnicos publica nueva guía de manejo integrado...' },
    { title: 'Clima: pronóstico de lluvias para la zona cafetera esta semana', source: 'FNC', date: '22 sep 2026', summary: 'Se esperan precipitaciones moderadas que beneficiarían el grano...' },
  ];

  constructor() {
    addIcons({ pricetagOutline, newspaperOutline, refreshOutline });
  }

  doRefresh(event: any): void {
    // TODO: llamar GET /price-and-news/coffee-price (Tarea 6.1)
    console.log('Refrescar precio y noticias');
    setTimeout(() => event.target.complete(), 1000);
  }
}