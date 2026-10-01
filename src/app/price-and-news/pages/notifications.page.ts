import { Component, effect, inject, computed } from '@angular/core';
import { IonBadge } from '@ionic/angular/ion-badge';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonChip } from '@ionic/angular/ion-chip';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { addIcons } from 'ionicons';
import { pricetagOutline, chevronForwardOutline, checkmarkCircleOutline, notificationsOffOutline } from 'ionicons/icons';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';

/**
 * Pantalla Notificaciones — Tarea 6.2.
 * Historial de notificaciones de cambio de precio (fecha + valor).
 * Accesible desde campana global + pestaña.
 */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    IonSpinner,
    IonBadge,
    IonButtons,
    IonBackButton,
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonChip,
    IonLabel,
    IonItem,
    IonList,
    CurrencyPipe,
    DateFormatPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/price-news" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">Notificaciones</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (priceAndNewsFacade.isLoading()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (priceAndNewsFacade.notifications().length === 0) {
        <div class="empty-state">
          <ion-icon name="notifications-off-outline" size="large" color="medium"></ion-icon>
          <h2 class="text-level-2 ion-margin-top">Sin notificaciones</h2>
          <p class="text-level-4 ion-margin">Recibirás notificaciones cuando cambie el precio del café.</p>
        </div>
      } @else {
        <ion-list lines="full">
          @for (n of priceAndNewsFacade.notifications(); track n.id) {
            <ion-item lines="full" [class.unread]="!n.read">
              <ion-card class="notification-card" [class.unread]="!n.read">
                <ion-card-content>
                  <div class="notification-header">
                    <ion-chip [color]="n.read ? 'medium' : 'primary'" size="small">
                      <ion-label>{{ n.read ? 'Leída' : 'Nueva' }}</ion-label>
                    </ion-chip>
                    @if (n.priceValue !== null) {
                      <ion-badge color="primary" slot="end">{{ n.priceValue | currency }}</ion-badge>
                    }
                  </div>
                  <div class="notification-body">
                    <p class="text-level-3">Cambio de precio del café FNC</p>
                    <p class="text-level-4">{{ n.date | dateFormat:'short' }}</p>
                  </div>
                  @if (!n.read) {
                    <ion-button fill="clear" color="primary" size="small" class="ion-margin-top" (click)="markAsRead(n.id)">
                      <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                      Marcar como leída
                    </ion-button>
                  }
                </ion-card-content>
              </ion-card>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
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
    .notification-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin: var(--spacing-sm) var(--spacing-md);
      transition: background 0.2s;
    }
    .notification-card.unread {
      background: var(--color-background);
      border-left: 4px solid var(--color-primary);
    }
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
    }
    .notification-body {
      margin-top: var(--spacing-xs);
    }
  `],
})
export class NotificationsPage {
  protected readonly priceAndNewsFacade = inject(PriceAndNewsFacade);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ pricetagOutline, chevronForwardOutline, checkmarkCircleOutline, notificationsOffOutline });

    // Cargar notificaciones al inicializar
    effect(() => {
      this.priceAndNewsFacade.loadNotifications();
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.priceAndNewsFacade.markAsRead(notificationId);
  }

  goToNotifications(): void {
    // Already here
  }
}