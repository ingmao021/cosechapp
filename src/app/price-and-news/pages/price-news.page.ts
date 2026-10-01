import { Component, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonLabel, IonBadge, IonButtons, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { pricetagOutline, newspaperOutline, refreshOutline, alertCircleOutline, chevronForwardOutline, notificationsOutline, openOutline } from 'ionicons/icons';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';

/**
 * Pestaña "Precio y Noticias" — Tarea 6.1.
 * Contenido según Design System 1.10:
 * - Precio actual FNC (valor grande, Zilla Slab, fecha)
 * - Lista de noticias (news-card molecule)
 * - Pull-to-refresh
 * - Badge de notificaciones no leídas
 */
@Component({
  selector: 'app-price-news',
  standalone: true,
  imports: [
    IonSpinner,
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonLabel,
    IonBadge,
    IonButtons,
    DateFormatPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Precio y Noticias</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="goToNotifications()">
            <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
            @if (priceAndNewsFacade.unreadCount() > 0) {
              <ion-badge color="danger">{{ priceAndNewsFacade.unreadCount() }}</ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content pulling-icon="refresh-outline"></ion-refresher-content>
      </ion-refresher>

      @if (priceAndNewsFacade.isLoading()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else {
        <!-- Precio FNC actual: sin dato no se muestra "$ 0", que parecería un precio real -->
        <ion-card class="fnc-price-card">
          <ion-card-content>
            <p class="price-label">Precio del café hoy · FNC</p>
            @if (priceAndNewsFacade.coffeePrice()) {
              <div class="price-value">{{ priceAndNewsFacade.formattedPrice() }}</div>
              <p class="price-meta">Actualizado: {{ priceAndNewsFacade.priceDate() }}</p>
            } @else {
              <div class="price-empty">Aún no hay precio publicado</div>
              <p class="price-meta">Desliza hacia abajo para actualizar.</p>
            }
          </ion-card-content>
        </ion-card>

        <!-- Notificaciones recientes -->
        @if (priceAndNewsFacade.unreadCount() > 0) {
          <ion-card class="notification-banner">
            <ion-card-content>
              <ion-icon name="alert-circle-outline" color="warning" slot="start"></ion-icon>
              <ion-label class="text-level-4">
                Tienes {{ priceAndNewsFacade.unreadCount() }} notificación{{ priceAndNewsFacade.unreadCount() > 1 ? 'es' : '' }} sin leer
              </ion-label>
              <ion-button fill="clear" color="primary" size="small" (click)="goToNotifications()">
                Ver
              </ion-button>
            </ion-card-content>
          </ion-card>
        }

        <!-- Noticias y Tips -->
        <div class="news-section">
          <h2 class="text-level-2 ion-padding-horizontal ion-margin-bottom">Noticias y Tips</h2>

          @if (priceAndNewsFacade.news().length === 0) {
            <div class="empty-state">
              <ion-icon name="newspaper-outline" size="large" color="medium"></ion-icon>
              <p class="text-level-4 ion-padding-horizontal">No hay noticias disponibles</p>
            </div>
          } @else {
            @for (news of priceAndNewsFacade.news(); track news.url) {
              <ion-card class="news-card">
                <ion-card-content>
                  <ion-card-header>
                    <ion-card-title class="text-level-3">{{ news.title }}</ion-card-title>
                    <ion-card-subtitle class="text-level-4">{{ news.source }} • {{ news.publishedAt | dateFormat:'short' }}</ion-card-subtitle>
                  </ion-card-header>
                  <p class="text-level-4 ion-margin-top">{{ news.summary }}</p>
                  <ion-button fill="clear" color="primary" size="small" class="ion-margin-top" (click)="openLink(news.url)">
                    <ion-icon name="open-outline" slot="end"></ion-icon>
                    Leer más
                  </ion-button>
                </ion-card-content>
              </ion-card>
            }
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .fnc-price-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin: var(--spacing-md);
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--ion-color-primary-shade) 100%);
      color: var(--color-text-on-primary);
    }
    .fnc-price-card ion-card-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding: var(--spacing-lg) var(--spacing-md);
    }
    .price-label,
    .price-meta {
      margin: 0;
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      color: var(--color-text-on-primary);
      opacity: 0.9;
    }
    .price-value {
      font-family: var(--font-family-display);
      font-size: 3rem;
      font-weight: var(--font-weight-bold);
      line-height: 1.1;
    }
    .price-empty {
      font-family: var(--font-family-display);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
    }
    .notification-banner {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin: var(--spacing-md);
      border-left: 4px solid var(--color-primary);
    }
    .news-section {
      padding: 0 var(--spacing-md) var(--spacing-xl);
    }
    .news-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--card-gap-vertical);
    }
    .empty-state {
      text-align: center;
      padding: var(--spacing-xl) var(--spacing-md);
    }
    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }
  `],
})
export class PriceNewsPage {
  protected readonly priceAndNewsFacade = inject(PriceAndNewsFacade);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ pricetagOutline, newspaperOutline, refreshOutline, alertCircleOutline, chevronForwardOutline, notificationsOutline, openOutline });

    // Cargar todo al inicializar
    effect(() => {
      this.priceAndNewsFacade.loadAll();
    });
  }

  doRefresh(event: any): void {
    this.priceAndNewsFacade.refreshCoffeePrice().then(() => {
      event.target.complete();
    });
  }

  goToNotifications(): void {
    this.router.navigate(['/price-and-news/notifications']);
  }

  openLink(url: string): void {
    window.open(url, '_system');
  }
}