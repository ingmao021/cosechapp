import { Component, computed, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { IonRefresher } from '@ionic/angular/ion-refresher';
import { IonRefresherContent } from '@ionic/angular/ion-refresher-content';
import { addIcons } from 'ionicons';
import { arrowForward, calendarClearOutline, pricetagOutline, refreshOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { DashboardFacade } from '../services/dashboard.facade';
import { DashboardActivityComponent } from '../components/dashboard-activity.component';
import { DashboardHeroComponent } from '../components/dashboard-hero.component';
import { DashboardLedgerComponent } from '../components/dashboard-ledger.component';
import { DashboardPendingComponent } from '../components/dashboard-pending.component';
import { DashboardTotalsComponent } from '../components/dashboard-totals.component';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';
import { SyncFacade } from '../../sync/services/sync.facade';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { DailyKilosChartComponent } from '@shared/components';
import { colombiaDateKey } from '../../shared/utils';

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/**
 * Inicio — dashboard de la cosecha activa (Design System §1.2). Solo informa: las
 * acciones sobre la cosecha (abrir, editar, eliminar, cerrar) viven en Crear.
 * De arriba hacia abajo: el bloque principal en verde hoja (cosecha activa, día N, kilos
 * de hoy frente a ayer y "Continuar"), pagos pendientes con atajo a "Pagar ahora", el
 * acumulado en celdas, la cuenta del valor y la ganancia estimados, kilos de los últimos
 * 7 días y la actividad reciente. Cada bloque es su propio componente; esta página los
 * ordena, carga los datos y navega.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    DailyKilosChartComponent,
    DashboardHeroComponent,
    DashboardPendingComponent,
    DashboardTotalsComponent,
    DashboardLedgerComponent,
    DashboardActivityComponent,
    KilosPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1 wordmark">CosechApp</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content pulling-icon="refresh-outline"></ion-refresher-content>
      </ion-refresher>

      <!-- Franja del día: fecha y precio FNC de un vistazo, como el resumen de arriba de
           una pantalla de inicio del sistema. Tocarla lleva a Mercado. -->
      <button type="button" class="today tile tappable" (click)="goToMarket()" aria-label="Ver precio y noticias del café">
        <span class="today__item">
          <span class="icon-chip" aria-hidden="true"><ion-icon name="calendar-clear-outline"></ion-icon></span>
          <span class="today__text">
            <span class="today__label">Hoy</span>
            <span class="today__value">{{ todayLabel }}</span>
          </span>
        </span>
        <span class="today__item">
          <span class="icon-chip" aria-hidden="true"><ion-icon name="pricetag-outline"></ion-icon></span>
          <span class="today__text">
            <span class="today__label">Precio FNC</span>
            <span class="today__value num">{{ priceAndNewsFacade.hasPrice() ? shortPrice() : 'Sin publicar' }}</span>
          </span>
        </span>
      </button>

      @if (harvestFacade.hasActiveHarvest()) {
        <!-- 1 y 2. Cosecha activa y kilos de hoy frente a ayer: el bloque en verde hoja. -->
        <app-dashboard-hero (continue)="goToHarvest()"></app-dashboard-hero>

        <!-- 3. Pagos pendientes -->
        <section aria-labelledby="pending-title">
          <h2 id="pending-title" class="section-title">Pagos pendientes</h2>
          <div class="card">
            <app-dashboard-pending (pay)="payNow($event)"></app-dashboard-pending>
          </div>
        </section>

        <!-- 4. Acumulado de la cosecha: cuatro celdas -->
        <section aria-labelledby="totals-title">
          <h2 id="totals-title" class="section-title">Acumulado de la cosecha</h2>
          <app-dashboard-totals></app-dashboard-totals>
        </section>

        <!-- 5. Valor y ganancia: la cuenta, estimada con el precio FNC -->
        <section aria-labelledby="value-title">
          <h2 id="value-title" class="section-title">Valor y ganancia <span class="section-title__sub">· estimados</span></h2>
          <div class="card">
            <app-dashboard-ledger></app-dashboard-ledger>
          </div>
        </section>

        <!-- 6. Kilos por día: una frase que resume la semana y el gráfico -->
        <section aria-labelledby="chart-title">
          <h2 id="chart-title" class="section-title">Kilos por día <span class="section-title__sub">· últimos 7 días</span></h2>
          <div class="card">
            @if (dashboard.bestDay(); as best) {
              <div class="week">
                <p class="week__total">
                  <span class="num">{{ dashboard.weekKilograms() | kilos: false }}</span><span class="week__unit"> kg</span>
                  <span class="week__label">en 7 días</span>
                </p>
                <p class="week__best">Mejor día: {{ dayName(best.date) }}, {{ best.kilograms | kilos }}</p>
              </div>
              <app-daily-kilos-chart [days]="dashboard.dailySeries()"></app-daily-kilos-chart>
            } @else if (dashboard.dailySeries().length > 0) {
              <p class="card__note">Aún no hay pesadas en los últimos 7 días.</p>
            } @else if (dashboard.isLoading()) {
              <ion-skeleton-text [animated]="true" class="sk sk--chart"></ion-skeleton-text>
            } @else {
              <p class="card__note">{{ loadErrorText }}</p>
            }
          </div>
        </section>

        <!-- 7. Actividad reciente, por día -->
        <section aria-labelledby="activity-title">
          <h2 id="activity-title" class="section-title">Actividad reciente</h2>
          <div class="card card--list">
            @if (dashboard.recentActivity().length > 0) {
              <app-dashboard-activity [items]="dashboard.recentActivity()" (open)="openPicker($event)"></app-dashboard-activity>
            } @else if (dashboard.isLoading()) {
              <ion-skeleton-text [animated]="true" class="sk sk--rows"></ion-skeleton-text>
            } @else if (dashboard.dashboard()) {
              <p class="card__note">Aún no hay pesadas ni pagos.</p>
            } @else {
              <p class="card__note">{{ loadErrorText }}</p>
            }
          </div>
        </section>
      } @else if (harvestFacade.isLoading()) {
        <!-- Primera carga: la forma del bloque principal, sin pasar antes por "No hay cosecha activa". -->
        <div class="hero-skeleton" role="status" aria-label="Cargando cosecha">
          <ion-skeleton-text [animated]="true" class="sk sk--line"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--title"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--figure"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--button"></ion-skeleton-text>
        </div>
      } @else {
        <!-- Sin cosecha: el costal de la marca invita a abrir una, en vez de un ícono genérico. -->
        <section class="card empty" aria-labelledby="empty-title">
          <img class="empty__art" src="assets/brand/splash-sack.webp" alt="" aria-hidden="true" />
          <h2 id="empty-title" class="empty__title">No hay cosecha activa</h2>
          <p class="empty__text">Abre una cosecha en Crear para empezar a registrar pesadas. Aquí verás su resumen.</p>
          <ion-button fill="solid" color="primary" class="empty__button" (click)="goToCreate()">
            Ir a Crear
            <ion-icon name="arrow-forward" slot="end" aria-hidden="true"></ion-icon>
          </ion-button>
        </section>
      }
    </ion-content>
  `,
  styles: [`
    /* El nombre de la app en la barra de Inicio: la única vez que la marca va como
       título (el resto de pestañas llevan su nombre en Inter). */
    .wordmark {
      font-family: var(--font-family-display);
      color: var(--color-primary-ink);
      letter-spacing: -0.01em;
    }
    /* Los dos datos van lado a lado; si con letra grande no caben, el segundo baja a
       otra línea en vez de cortarse (cada uno mide lo que su texto, sin recortar). */
    .today {
      flex-wrap: wrap;
      gap: var(--spacing-sm) var(--spacing-md);
      margin-bottom: var(--spacing-md);
      padding: var(--spacing-sm) 12px;
    }
    .today__item {
      display: flex;
      flex: 1 1 auto;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .today__text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .today__label {
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }
    .today__value {
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      white-space: nowrap;
    }
    .today__value::first-letter {
      text-transform: uppercase;
    }
    .today .icon-chip {
      --icon-chip-size: 36px;
    }

    /* Tarjeta blanca de cada bloque, con su nombre encima (.section-title) como en los
       grupos de ajustes del sistema. */
    .card {
      margin: 0;
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
      font-family: var(--font-family-body);
    }
    .card--list {
      padding: var(--spacing-xs) 0;
    }
    .card--list .card__note,
    .card--list .sk {
      margin: 12px var(--spacing-md);
    }
    .section-title__sub {
      font-weight: var(--font-weight-regular);
      color: var(--color-text-muted);
    }
    .card__note {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    /* 6. La frase de la semana: el total en Zilla Slab y el mejor día, antes del gráfico. */
    .week {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 2px var(--spacing-md);
      margin-bottom: 4px;
    }
    .week p {
      margin: 0;
    }
    .week__total {
      font-family: var(--font-family-display);
      font-size: 1.375rem;
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }
    .week__unit {
      font-size: 0.7em;
    }
    .week__label {
      margin-left: 6px;
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-regular);
      color: var(--color-text-muted);
    }
    .week__best {
      font-size: var(--font-size-footnote);
      color: var(--color-text-muted);
    }

    /* Sin cosecha */
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-md);
      text-align: center;
    }
    .empty__art {
      width: 128px;
      height: auto;
      margin-bottom: var(--spacing-sm);
    }
    .empty__title {
      margin: 0 0 6px;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    .empty__text {
      max-width: 300px;
      margin: 0 0 var(--spacing-md);
      font-size: var(--font-size-md);
      line-height: 1.45;
      color: var(--color-text-muted);
    }
    .empty__button {
      --border-radius: var(--radius-full);
      margin: 0;
    }

    /* Esqueletos */
    .hero-skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding: 20px var(--spacing-md) var(--spacing-md);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    .sk {
      --background: rgba(29, 33, 27, 0.07);
      --background-rgb: 29, 33, 27;
      margin: 0;
      border-radius: var(--radius-sm);
    }
    .sk--line { width: 45%; height: 14px; }
    .sk--title { width: 65%; height: 26px; }
    .sk--figure { width: 50%; height: 52px; margin-top: var(--spacing-sm); }
    .sk--button { width: 100%; height: 52px; margin-top: var(--spacing-sm); border-radius: var(--radius-full); }
    .sk--chart { width: 100%; height: 150px; }
    .sk--rows { width: auto; height: 112px; }
  `],
})
export class HomePage {
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly dashboard = inject(DashboardFacade);
  protected readonly priceAndNewsFacade = inject(PriceAndNewsFacade);
  private readonly sync = inject(SyncFacade);
  private readonly router = inject(Router);

  protected readonly loadErrorText = 'No se pudo cargar. Desliza hacia abajo para intentar de nuevo.';

  /** "sáb 24 oct": el día en Colombia, aunque el teléfono tenga otra zona horaria. Corto
   *  para que quepa junto al precio en 360dp. */
  protected readonly todayLabel = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date()).replace(/[.,]/g, '');
  /** El precio sin " COP": la etiqueta "Precio FNC" ya dice de qué se trata. */
  protected readonly shortPrice = computed(() => this.priceAndNewsFacade.formattedPrice().replace(/\s*COP$/, ''));

  constructor() {
    addIcons({ arrowForward, calendarClearOutline, pricetagOutline, refreshOutline });

    // Al enviarse la cola de pesadas, el resumen del servidor ya las incluye.
    effect(() => {
      if (this.sync.lastSync()) untracked(() => void this.dashboard.load());
    });
  }

  /** "hoy" o el día de la semana ("vie") de un "AAAA-MM-DD". */
  protected dayName(date: string): string {
    return date === colombiaDateKey(new Date()) ? 'hoy' : WEEKDAYS[new Date(date).getUTCDay()];
  }

  /** Cada vez que se vuelve a Inicio (ej. después de pesar o pagar) los datos se refrescan. */
  ionViewWillEnter(): void {
    void this.reload();
  }

  refresh(event: CustomEvent): void {
    this.reload().finally(() => (event.target as HTMLIonRefresherElement).complete());
  }

  private async reload(): Promise<void> {
    const price = this.priceAndNewsFacade.loadCoffeePrice();
    await this.harvestFacade.loadActiveHarvest();
    await Promise.all([this.dashboard.load(), price]);
  }

  goToHarvest(): void {
    this.router.navigate(['/harvest/crews']);
  }

  /** Atajo: abre el detalle del recolector con "Pagar ahora" ya en marcha. */
  payNow(pickerId: string): void {
    this.router.navigate(['/harvest/pickers', pickerId], { queryParams: { desde: 'inicio', pagar: 1 } });
  }

  /** `desde=inicio`: el botón volver del detalle regresa aquí y no a la cuadrilla. */
  openPicker(pickerId: string): void {
    this.router.navigate(['/harvest/pickers', pickerId], { queryParams: { desde: 'inicio' } });
  }

  goToMarket(): void {
    this.router.navigate(['/price-news']);
  }

  goToCreate(): void {
    this.router.navigate(['/create']);
  }
}
