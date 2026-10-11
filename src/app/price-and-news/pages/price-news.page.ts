import { Component, OnInit, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonLabel, IonBadge, IonButtons, IonSpinner } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { pricetagOutline, newspaperOutline, refreshOutline, alertCircleOutline, chevronForwardOutline, notificationsOutline, openOutline, sparklesOutline, bulbOutline, cloudOfflineOutline } from 'ionicons/icons';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { AppChipComponent } from '@shared/components/app-chip.component';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';

/**
 * Pestaña "Precio y Noticias" — Tarea 6.1.
 * Contenido según Design System 1.10:
 * - Precio actual FNC (valor grande, Zilla Slab, fecha) y análisis corto con IA
 * - Noticias del café y tips agronómicos del mes (Gemini, con fuente real)
 * - Pull-to-refresh y datos guardados cuando no hay señal
 * - Badge de notificaciones no leídas
 */
@Component({
  selector: 'app-price-news',
  standalone: true,
  imports: [
    IonSpinner,
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
    IonLabel,
    IonBadge,
    IonButtons,
    DateFormatPipe,
    AppChipComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Precio y Noticias</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="goToNotifications()" aria-label="Notificaciones">
            <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
            @if (facade.unreadCount() > 0) {
              <ion-badge color="danger">{{ facade.unreadCount() }}</ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content pulling-icon="refresh-outline"></ion-refresher-content>
      </ion-refresher>

      <!-- Spinner solo en la primera carga; al refrescar se queda lo que ya se ve -->
      @if (facade.isLoading() && isEmpty()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
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
          <ion-card class="notification-banner">
            <ion-card-content>
              <ion-icon name="alert-circle-outline" color="warning" slot="start"></ion-icon>
              <ion-label class="text-level-4">
                Tienes {{ facade.unreadCount() }} notificación{{ facade.unreadCount() > 1 ? 'es' : '' }} sin leer
              </ion-label>
              <ion-button fill="clear" color="primary" size="small" (click)="goToNotifications()">
                Ver
              </ion-button>
            </ion-card-content>
          </ion-card>
        }

        <!-- Noticias -->
        <section class="section">
          <div class="section-header">
            <h2 class="text-level-2">Noticias del café</h2>
            <app-chip icon="sparkles-outline">Con IA</app-chip>
          </div>

          @if (facade.news().length === 0) {
            <div class="empty-state">
              <ion-icon name="newspaper-outline" size="large" color="medium"></ion-icon>
              <p class="text-level-4">Todavía no hay noticias. Se actualizan cada mañana.</p>
            </div>
          } @else {
            @for (news of facade.news(); track news.id) {
              <ion-card class="news-card">
                <ion-card-content>
                  <p class="news-meta">{{ news.source }} · {{ news.publishedAt | dateFormat:'short' }}</p>
                  <h3 class="news-title">{{ news.title }}</h3>
                  <p class="news-summary">{{ news.summary }}</p>
                  <ion-button fill="clear" color="primary" size="small" class="news-link" (click)="openLink(news.url)">
                    Leer en {{ news.source || 'la fuente' }}
                    <ion-icon name="open-outline" slot="end"></ion-icon>
                  </ion-button>
                </ion-card-content>
              </ion-card>
            }
          }
        </section>

        <!-- Tips del mes -->
        <section class="section">
          <div class="section-header">
            <h2 class="text-level-2">Tips del mes</h2>
          </div>

          @if (facade.tips().length === 0) {
            <div class="empty-state">
              <ion-icon name="bulb-outline" size="large" color="medium"></ion-icon>
              <p class="text-level-4">Los tips de este mes aparecerán pronto.</p>
            </div>
          } @else {
            @for (tip of facade.tips(); track tip.id) {
              <button type="button" class="tip-card" (click)="openLink(tip.url)">
                <ion-icon name="bulb-outline" class="tip-icon" aria-hidden="true"></ion-icon>
                <span class="tip-body">
                  <span class="tip-title">{{ tip.title }}</span>
                  <span class="tip-summary">{{ tip.summary }}</span>
                  <span class="tip-source">Fuente: {{ tip.source }}</span>
                </span>
              </button>
            }
          }

          @if (facade.news().length > 0 || facade.tips().length > 0) {
            <p class="ai-disclaimer">
              Noticias y tips reunidos con IA (Gemini) desde sus fuentes. Revisa la fuente antes de tomar decisiones.
            </p>
          }
        </section>
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
    .price-analysis {
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-sm);
      border-top: 1px solid rgba(255, 255, 255, 0.25);
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
    .notification-banner {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin: var(--spacing-md);
      border-left: 4px solid var(--color-primary);
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
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin: 0 0 var(--card-gap-vertical);
    }
    .news-card ion-card-content {
      padding: var(--spacing-md);
    }
    .news-meta {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }
    .news-title {
      margin: 0 0 var(--spacing-xs);
      font-family: var(--font-family-display);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      line-height: 1.25;
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
    .tip-card {
      display: flex;
      gap: var(--spacing-sm);
      width: 100%;
      margin: 0 0 var(--spacing-sm);
      padding: var(--spacing-md);
      text-align: left;
      font: inherit;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
    .tip-icon {
      flex: none;
      font-size: 22px;
      color: var(--color-primary);
    }
    .tip-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .tip-title {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-md);
    }
    .tip-summary {
      font-size: var(--font-size-sm);
      line-height: 1.4;
    }
    .tip-source {
      margin-top: 2px;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }
    .ai-disclaimer {
      margin: var(--spacing-sm) 0 0;
      font-size: var(--font-size-xs);
      line-height: 1.4;
      color: var(--color-text-muted);
    }
    .empty-state {
      text-align: center;
      padding: var(--spacing-lg) var(--spacing-md);
      color: var(--color-text-muted);
    }
    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }
  `],
})
export class PriceNewsPage implements OnInit {
  protected readonly facade = inject(PriceAndNewsFacade);
  private readonly router = inject(Router);

  protected readonly isEmpty = computed(
    () => !this.facade.coffeePrice() && this.facade.news().length === 0 && this.facade.tips().length === 0,
  );

  constructor() {
    addIcons({ pricetagOutline, newspaperOutline, refreshOutline, alertCircleOutline, chevronForwardOutline, notificationsOutline, openOutline, sparklesOutline, bulbOutline, cloudOfflineOutline });
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
