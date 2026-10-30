import { Component, OnInit, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonBadge, IonButtons, IonSkeletonText } from '@ionic/angular';
import { EmptyStateComponent, ListSkeletonComponent, NavRowComponent } from '@shared/components';
import { addIcons } from 'ionicons';
import { pricetagOutline, newspaperOutline, refreshOutline, alertCircleOutline, chevronForwardOutline, notificationsOutline, openOutline, sparklesOutline, cloudOfflineOutline } from 'ionicons/icons';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';

/**
 * Pestaña "Mercado" (precio y noticias del café) — Tarea 6.1.
 * Contenido según Design System 1.10:
 * - Precio actual FNC (valor grande, Zilla Slab, fecha) y análisis corto con IA
 * - Noticias del café (Google Noticias, elegidas con IA), con enlace a la nota original
 * - Pull-to-refresh y datos guardados cuando no hay señal
 * - Badge de notificaciones no leídas
 */
@Component({
  selector: 'app-price-news',
  standalone: true,
  imports: [
    IonSkeletonText,
    EmptyStateComponent,
    ListSkeletonComponent,
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
    NavRowComponent,
    IonBadge,
    IonButtons,
    DateFormatPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Mercado</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" class="bell" (click)="goToNotifications()"
            [attr.aria-label]="facade.unreadCount() > 0 ? 'Notificaciones, ' + facade.unreadCount() + ' sin leer' : 'Notificaciones'">
            <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
            @if (facade.unreadCount() > 0) {
              <ion-badge color="danger" aria-hidden="true">{{ facade.unreadCount() }}</ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content pulling-icon="refresh-outline"></ion-refresher-content>
      </ion-refresher>

      <!-- Esqueleto solo en la primera carga; al refrescar se queda lo que ya se ve -->
      @if (facade.isLoading() && isEmpty()) {
        <div class="skeleton" role="status" aria-label="Cargando precio y noticias">
          <ion-skeleton-text [animated]="true" class="skeleton__price"></ion-skeleton-text>
          <app-list-skeleton [rows]="3" [avatar]="false"></app-list-skeleton>
        </div>
      } @else {
        @if (facade.isOfflineData()) {
          <p class="offline-note">
            <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
            Sin conexión · mostrando lo último guardado
          </p>
        }

        <!-- Precio FNC actual: sin dato no se muestra "$ 0", que parecería un precio real -->
        <ion-card class="fnc-price-card">
          <ion-card-content>
            <p class="price-label">Precio del café hoy · FNC</p>
            @if (facade.coffeePrice()) {
              <div class="price-value">{{ facade.formattedPrice() }}</div>
              <p class="price-meta">Carga de 125 kg · Actualizado: {{ facade.priceDate() }}</p>
            } @else {
              <div class="price-empty">Aún no hay precio publicado</div>
              <p class="price-meta">Desliza hacia abajo para actualizar.</p>
            }

            @if (facade.analysis(); as analysis) {
              <div class="price-analysis">
                <p>{{ analysis.text }}</p>
                <span class="ai-tag">
                  <ion-icon name="sparkles-outline" aria-hidden="true"></ion-icon>
                  Generado con IA · Gemini
                </span>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Notificaciones recientes -->
        @if (facade.unreadCount() > 0) {
          <button
            app-nav-row
            class="notification-row"
            icon="notifications-outline"
            [label]="facade.unreadCount() + ' ' + (facade.unreadCount() > 1 ? 'notificaciones sin leer' : 'notificación sin leer')"
            subtitle="Cambios de precio y avisos de la app"
            (click)="goToNotifications()"
          ></button>
        }

        <!-- Noticias -->
        <section class="section">
          <div class="section-header">
            <h2 class="text-level-2">Noticias del café</h2>
          </div>

          @if (facade.news().length === 0) {
            <app-empty-state icon="newspaper-outline" title="Sin noticias por ahora" [flat]="true">
              <p>Se actualizan cada mañana.</p>
            </app-empty-state>
          } @else {
            <div class="stagger-in">
            @for (news of facade.news(); track news.id) {
              <ion-card class="news-card">
                <ion-card-content>
                  <p class="news-meta">{{ news.source }} · {{ news.publishedAt | dateFormat:'short' }}</p>
                  <h3 class="news-title">{{ news.title }}</h3>
                  @if (news.summary) {
                    <p class="news-summary">{{ news.summary }}</p>
                  }
                  <ion-button fill="clear" color="primary" size="small" class="news-link" (click)="openLink(news.url)">
                    Leer en {{ news.source || 'la fuente' }}
                    <ion-icon name="open-outline" slot="end"></ion-icon>
                  </ion-button>
                </ion-card-content>
              </ion-card>
            }
            </div>
          }
        </section>

        @if (facade.news().length > 0) {
          <p class="ai-disclaimer">
            Noticias de Google Noticias, elegidas con IA para caficultores. Ábrelas para leerlas en su medio.
          </p>
        }
      }
    </ion-content>
  `,
  styles: [`
    .fnc-price-card {
      --card-shadow: var(--shadow-raised);
      position: relative;
      margin: var(--spacing-md);
      --background: var(--color-primary);
      background: var(--color-primary);
      color: var(--color-text-on-primary);
    }
    /* Firma de la marca: las ramas de café del arranque, multiplicadas sobre el verde.
       El blanco del dibujo desaparece y solo quedan los trazos, un verde más hondo.
       Tenue: el texto oscuro pasa por encima y los trazos no deben comerle contraste. */
    .fnc-price-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: url('/assets/brand/splash-bg.webp') center 30% / 160% auto no-repeat;
      mix-blend-mode: multiply;
      opacity: 0.3;
      pointer-events: none;
    }
    .fnc-price-card ion-card-content {
      position: relative;
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
      /* Grande, pero sin desbordar un precio de 7 dígitos en 360dp. */
      font-size: clamp(1.75rem, 8vw, 2.75rem);
      font-weight: var(--font-weight-bold);
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }
    .price-empty {
      font-family: var(--font-family-body);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
    }
    .price-analysis {
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-sm);
      border-top: 1px solid rgba(var(--ion-color-primary-contrast-rgb), 0.2);
    }
    .price-analysis p {
      margin: 0 0 var(--spacing-xs);
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      line-height: 1.4;
      color: var(--color-text-on-primary);
    }
    .ai-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-xs);
      opacity: 0.85;
    }
    .offline-note {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin: var(--spacing-md) var(--spacing-md) 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .offline-note ion-icon {
      flex-shrink: 0;
      color: var(--color-secondary);
    }
    .notification-row {
      width: calc(100% - 2 * var(--spacing-md));
      margin: 0 var(--spacing-md) var(--spacing-sm);
    }
    /* Campana: el número va en la esquina, como el de las apps del sistema. Se ubica
       respecto al ícono (el contenedor interno del botón), no del círculo. */
    .bell ion-badge {
      position: absolute;
      top: -8px;
      right: -12px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: var(--font-weight-bold);
      line-height: 18px;
    }
    .section {
      padding: 0 var(--spacing-md) var(--spacing-lg);
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }
    .section-header h2 {
      margin: 0;
    }
    .news-card {
      --card-shadow: var(--shadow-card);
      margin: 0 0 var(--card-gap-vertical);
    }
    /* El ion-card global ya trae padding: aquí el contenido manda, sin doble margen. */
    .news-card,
    .fnc-price-card {
      padding: 0;
    }
    .news-card ion-card-content {
      padding: var(--spacing-md) var(--spacing-md) var(--spacing-xs);
    }
    .news-meta {
      margin: 0 0 6px;
      font-size: var(--font-size-footnote);
      color: var(--color-text-muted);
    }
    .news-title {
      margin: 0 0 var(--spacing-xs);
      font-family: var(--font-family-body);
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
      line-height: 1.35;
      color: var(--color-text);
    }
    .news-summary {
      margin: 0;
      font-size: var(--font-size-md);
      line-height: 1.45;
      color: var(--color-text);
    }
    .news-link {
      margin: var(--spacing-xs) 0 0 calc(-1 * var(--spacing-sm));
    }
    .ai-disclaimer {
      margin: 0 var(--spacing-md) var(--spacing-xl);
      font-size: var(--font-size-xs);
      line-height: 1.4;
      color: var(--color-text-muted);
    }
    .skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      padding: var(--spacing-md);
    }
    .skeleton__price {
      --background: rgba(29, 33, 27, 0.07);
      --background-rgb: 29, 33, 27;
      width: 100%;
      height: 168px;
      margin: 0;
      border-radius: var(--radius-lg);
    }
  `],
})
export class PriceNewsPage implements OnInit {
  protected readonly facade = inject(PriceAndNewsFacade);
  private readonly router = inject(Router);

  protected readonly isEmpty = computed(
    () => !this.facade.coffeePrice() && this.facade.news().length === 0,
  );

  constructor() {
    addIcons({ pricetagOutline, newspaperOutline, refreshOutline, alertCircleOutline, chevronForwardOutline, notificationsOutline, openOutline, sparklesOutline, cloudOfflineOutline });
  }

  ngOnInit(): void {
    this.facade.loadAll();
  }

  doRefresh(event: CustomEvent): void {
    this.facade.refresh().finally(() => (event.target as HTMLIonRefresherElement).complete());
  }

  goToNotifications(): void {
    this.router.navigate(['/price-and-news/notifications']);
  }

  openLink(url: string): void {
    window.open(url, '_system');
  }
}
