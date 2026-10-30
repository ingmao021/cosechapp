import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { EmptyStateComponent, ListSkeletonComponent } from '@shared/components';
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
    EmptyStateComponent,
    ListSkeletonComponent,
    IonButtons,
    IonBackButton,
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
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
      <div class="page">
        @if (priceAndNewsFacade.isLoading() && priceAndNewsFacade.notifications().length === 0) {
          <app-list-skeleton [rows]="4" [avatar]="false"></app-list-skeleton>
        } @else if (priceAndNewsFacade.notifications().length === 0) {
          <app-empty-state icon="notifications-off-outline" title="Sin notificaciones">
            <p>Recibirás notificaciones cuando cambie el precio del café.</p>
          </app-empty-state>
        } @else {
          <ul class="notif-list stagger-in">
            @for (n of priceAndNewsFacade.notifications(); track n.id) {
              <li class="notif" [class.notif--unread]="!n.read">
                <span class="icon-chip" aria-hidden="true"><ion-icon name="pricetag-outline"></ion-icon></span>
                <div class="notif__body">
                  <div class="notif__head">
                    <p class="notif__title">Cambio de precio FNC</p>
                    @if (n.priceValue !== null) {
                      <strong class="notif__price num">{{ n.priceValue | currency }}</strong>
                    }
                  </div>
                  <p class="notif__date">
                    @if (!n.read) {
                      <span class="notif__dot" aria-hidden="true"></span>
                      <span class="notif__new">Nueva ·</span>
                    }
                    {{ n.date | dateFormat:'short' }}
                  </p>
                  @if (!n.read) {
                    <ion-button fill="clear" color="primary" size="small" class="notif__action" (click)="markAsRead(n.id)">
                      <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                      Marcar como leída
                    </ion-button>
                  }
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .page {
      padding: var(--spacing-md) var(--screen-margin) var(--spacing-xl);
    }
    .notif-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--card-gap-vertical);
    }
    /* Chip a la izquierda y el contenido alineado a su derecha (texto a 68dp del borde). */
    .notif {
      display: flex;
      align-items: flex-start;
      gap: var(--row-gap);
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
      font-family: var(--font-family-body);
      transition: background-color var(--dur-base) var(--ease-out);
    }
    /* Leída: el chip pasa a gris; sin leer conserva el café y un punto. Sin bordes de color. */
    .notif:not(.notif--unread) .icon-chip {
      background: var(--color-surface-muted);
      color: var(--color-text-muted);
    }
    .notif__body {
      flex: 1;
      min-width: 0;
    }
    .notif__head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--spacing-sm);
    }
    .notif__title {
      margin: 0;
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    .notif__price {
      flex-shrink: 0;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    .notif__date {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 2px 0 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .notif__dot {
      width: 8px;
      height: 8px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--color-primary);
    }
    .notif__new {
      color: var(--color-primary-ink);
      font-weight: var(--font-weight-semibold);
    }
    .notif__action {
      margin: var(--spacing-xs) 0 0 calc(-1 * var(--spacing-sm));
    }
  `],
})
export class NotificationsPage {
  protected readonly priceAndNewsFacade = inject(PriceAndNewsFacade);

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