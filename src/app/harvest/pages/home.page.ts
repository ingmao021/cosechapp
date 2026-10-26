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
import {
  addCircleOutline,
  arrowForward,
  calendarClearOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  cloudUploadOutline,
  flagOutline,
  pricetagOutline,
  refreshOutline,
  removeOutline,
  trendingDownOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { DashboardFacade, FNC_LOAD_KG } from '../services/dashboard.facade';
import { DashboardActivityComponent } from '../components/dashboard-activity.component';
import { DashboardLedgerComponent } from '../components/dashboard-ledger.component';
import { DashboardPendingComponent } from '../components/dashboard-pending.component';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';
import { NetworkService } from '../../network/services/network.service';
import { SyncFacade } from '../../sync/services/sync.facade';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { DailyKilosChartComponent, EmptyStateComponent } from '@shared/components';
import { formatKilos } from '../../shared/utils';

/**
 * Inicio — dashboard de la cosecha activa (Design System §1.2). Solo informa: las
 * acciones sobre la cosecha (abrir, editar, eliminar, cerrar) viven en Crear.
 * De arriba hacia abajo: cosecha activa (día N y "Continuar"), kilos de hoy frente a
 * ayer, pagos pendientes (con atajo a "Pagar ahora"), acumulado con la ganancia
 * estimada, valor estimado a precio FNC, kilos de los últimos 7 días y actividad reciente.
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
    EmptyStateComponent,
    DailyKilosChartComponent,
    DashboardPendingComponent,
    DashboardLedgerComponent,
    DashboardActivityComponent,
    CurrencyPipe,
    DateFormatPipe,
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
        <!-- 1. Cosecha activa -->
        <section class="card harvest" aria-labelledby="harvest-name">
          <p class="eyebrow">Cosecha activa</p>
          <h2 id="harvest-name" class="harvest__name">{{ harvestFacade.activeHarvestName() }}</h2>
          <p class="harvest__day">Día <span class="num">{{ dashboard.harvestDay() }}</span> de la cosecha</p>

          <div class="status-row">
            @if (sync.pendingCount() > 0) {
              <span class="pill pill--warn">
                <ion-icon name="cloud-upload-outline" aria-hidden="true"></ion-icon>
                {{ sync.pendingCount() }} {{ sync.pendingCount() === 1 ? 'pesada' : 'pesadas' }} por enviar
              </span>
            } @else if (!network.isOnline()) {
              <span class="pill pill--warn">
                <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
                Sin conexión · se guarda en el teléfono
              </span>
            } @else if (sync.lastSync()) {
              <span class="pill">
                <ion-icon name="cloud-done-outline" aria-hidden="true"></ion-icon>
                Todo enviado · {{ sync.lastSync() | dateFormat: 'time' }}
              </span>
            } @else {
              <span class="pill">
                <ion-icon name="cloud-done-outline" aria-hidden="true"></ion-icon>
                En línea
              </span>
            }
          </div>

          <ion-button expand="block" fill="solid" color="primary" class="continue-btn" (click)="goToHarvest()">
            Continuar
            <ion-icon name="arrow-forward" slot="end" aria-hidden="true"></ion-icon>
          </ion-button>
        </section>

        <!-- 2. Kilos de hoy frente a ayer -->
        <section aria-labelledby="kilos-title">
          <h2 id="kilos-title" class="section-title">Kilos recogidos</h2>
          <div class="card">
            <dl class="stats">
              <div class="stat">
                <dt>Hoy</dt>
                <dd class="num">{{ dashboard.todayKilograms() | kilos: false }}<span class="unit">kg</span></dd>
              </div>
              <div class="stat stat--muted">
                <dt>Ayer</dt>
                <dd class="num">
                  @if (dashboard.harvestDay() > 1 && dashboard.yesterdayKilograms() !== null) {
                    {{ dashboard.yesterdayKilograms() | kilos: false }}<span class="unit">kg</span>
                  } @else {
                    <span aria-label="Sin dato">—</span>
                  }
                </dd>
              </div>
            </dl>
            @if (delta(); as delta) {
              <p class="delta" [class.delta--up]="delta.kind === 'up'">
                <ion-icon [name]="delta.icon" aria-hidden="true"></ion-icon>
                {{ delta.text }}
              </p>
            }
          </div>
        </section>

        <!-- 3. Pagos pendientes -->
        <section aria-labelledby="pending-title">
          <h2 id="pending-title" class="section-title">Pagos pendientes</h2>
          <div class="card">
            <app-dashboard-pending (pay)="payNow($event)"></app-dashboard-pending>
          </div>
        </section>

        <!-- 4. Acumulado de la cosecha -->
        <section aria-labelledby="totals-title">
          <h2 id="totals-title" class="section-title">Acumulado de la cosecha</h2>
          <div class="card">
            <app-dashboard-ledger></app-dashboard-ledger>
          </div>
        </section>

        <!-- 5. Valor estimado de lo recogido -->
        <section aria-labelledby="value-title">
          <h2 id="value-title" class="section-title">Valor estimado de lo recogido</h2>
          <div class="card">
            @if (dashboard.estimatedValue() !== null) {
              <p class="figure num">{{ dashboard.estimatedValue() | currency }}</p>
              <p class="hint">
                {{ dashboard.projectedDryKilograms() | kilos }} secos (cereza ÷ 5) × precio FNC de
                <span class="nowrap">{{ priceAndNewsFacade.coffeePrice()!.value | currency: true : false }}</span>
                la carga de {{ fncLoadKg }} kg.
              </p>
            } @else {
              <p class="card__note">
                <ion-icon name="pricetag-outline" aria-hidden="true"></ion-icon>
                Sin precio FNC publicado. Se calcula cuando haya precio.
              </p>
            }
          </div>
        </section>

        <!-- 6. Kilos por día -->
        <section aria-labelledby="chart-title">
          <h2 id="chart-title" class="section-title">Kilos por día <span class="section-title__sub">· últimos 7 días</span></h2>
          <div class="card">
            @if (dashboard.dailySeries().length > 0) {
              <app-daily-kilos-chart [days]="dashboard.dailySeries()"></app-daily-kilos-chart>
            } @else if (dashboard.isLoading()) {
              <ion-skeleton-text [animated]="true" class="sk sk--chart"></ion-skeleton-text>
            } @else {
              <p class="card__note">{{ loadErrorText }}</p>
            }
          </div>
        </section>

        <!-- 7. Actividad reciente -->
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
        <!-- Primera carga: la forma de la tarjeta, sin pasar antes por "No hay cosecha activa". -->
        <div class="card harvest harvest--skeleton" role="status" aria-label="Cargando cosecha">
          <ion-skeleton-text [animated]="true" class="sk sk--title"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--line"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--stats"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="sk sk--button"></ion-skeleton-text>
        </div>
      } @else {
        <app-empty-state icon="add-circle-outline" title="No hay cosecha activa">
          <p>Abre una cosecha en Crear para empezar a registrar pesadas. Aquí verás su resumen.</p>
          <ion-button fill="solid" color="primary" (click)="goToCreate()">
            Ir a Crear
            <ion-icon name="arrow-forward" slot="end" aria-hidden="true"></ion-icon>
          </ion-button>
        </app-empty-state>
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
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .card__note ion-icon {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--color-primary-ink);
    }
    .hint {
      margin: var(--spacing-sm) 0 0;
      font-size: var(--font-size-footnote);
      line-height: 1.4;
      color: var(--color-text-muted);
    }
    .nowrap {
      white-space: nowrap;
    }
    /* Cifra destacada en Zilla Slab, como en el cuaderno de la finca. */
    .figure {
      margin: 0;
      font-family: var(--font-family-display);
      font-size: var(--font-size-figure);
      font-weight: var(--font-weight-bold);
      line-height: 1.05;
      color: var(--color-text);
      overflow-wrap: anywhere;
    }
    /* 1. Cosecha activa */
    .harvest {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-top: 20px;
    }
    .eyebrow {
      margin: 0 0 2px;
      font-size: var(--font-size-footnote);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }
    .harvest__name {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      letter-spacing: -0.01em;
      line-height: 1.25;
      color: var(--color-text);
      overflow-wrap: anywhere;
    }
    .harvest__day {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .harvest__day .num {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    .status-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      margin: 12px 0 var(--spacing-md);
    }
    .pill--warn {
      background: rgba(183, 121, 31, 0.12);
    }
    .pill--warn ion-icon {
      color: var(--ion-color-warning-shade);
    }
    .continue-btn {
      --border-radius: var(--radius-full);
      height: 52px;
      min-height: 52px;
      margin: 0;
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
    }

    /* 2. Hoy y ayer en dos celdas suaves; ayer en gris para que hoy sea lo primero que se lee. */
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
      margin: 0;
    }
    .stat {
      min-width: 0;
      padding: 12px var(--spacing-md);
      border-radius: var(--radius-md);
      background: var(--color-background);
    }
    .stat dt {
      font-size: var(--font-size-footnote);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }
    /* La cifra manda; la unidad va más pequeña para que "1.234,5 kg" quepa en 360dp. */
    .stat dd {
      margin: 4px 0 0;
      font-family: var(--font-family-display);
      font-size: clamp(1.375rem, 7vw, 2rem);
      line-height: 1.05;
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
      overflow-wrap: anywhere;
    }
    .unit {
      margin-left: 0.2em;
      font-size: 0.6em;
    }
    .stat--muted dd {
      color: var(--color-text-muted);
    }
    .delta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 12px 0 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }
    .delta ion-icon {
      flex-shrink: 0;
      font-size: 18px;
    }
    .delta--up {
      color: var(--color-primary-ink);
    }

    /* Esqueletos */
    .harvest--skeleton {
      gap: var(--spacing-sm);
    }
    .sk {
      --background: rgba(29, 33, 27, 0.07);
      --background-rgb: 29, 33, 27;
      margin: 0;
      border-radius: var(--radius-sm);
    }
    .sk--title { width: 65%; height: 26px; }
    .sk--line { width: 45%; height: 14px; }
    .sk--stats { width: 100%; height: 64px; margin-top: var(--spacing-sm); border-radius: var(--radius-md); }
    .sk--button { width: 100%; height: 52px; margin-top: var(--spacing-sm); border-radius: var(--radius-full); }
    .sk--chart { width: 100%; height: 150px; }
    .sk--rows { width: auto; height: 112px; }
  `],
})
export class HomePage {
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly dashboard = inject(DashboardFacade);
  protected readonly priceAndNewsFacade = inject(PriceAndNewsFacade);
  protected readonly network = inject(NetworkService);
  protected readonly sync = inject(SyncFacade);
  private readonly router = inject(Router);

  protected readonly fncLoadKg = FNC_LOAD_KG;
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

  /** Hoy frente a ayer, en palabras (el color solo acompaña). */
  protected readonly delta = computed(() => {
    if (this.dashboard.harvestDay() <= 1) return { kind: 'first', icon: 'flag-outline', text: 'Primer día de la cosecha' };
    const yesterday = this.dashboard.yesterdayKilograms();
    if (yesterday === null) return null;
    const diff = Math.round((this.dashboard.todayKilograms() - yesterday) * 1000) / 1000;
    if (diff === 0) return { kind: 'same', icon: 'remove-outline', text: 'Igual que ayer' };
    return diff > 0
      ? { kind: 'up', icon: 'trending-up-outline', text: `${formatKilos(diff)} más que ayer` }
      : { kind: 'down', icon: 'trending-down-outline', text: `${formatKilos(-diff)} menos que ayer` };
  });

  constructor() {
    addIcons({
      addCircleOutline,
      arrowForward,
      calendarClearOutline,
      cloudDoneOutline,
      cloudOfflineOutline,
      cloudUploadOutline,
      flagOutline,
      pricetagOutline,
      refreshOutline,
      removeOutline,
      trendingDownOutline,
      trendingUpOutline,
    });

    // Al enviarse la cola de pesadas, el resumen del servidor ya las incluye.
    effect(() => {
      if (this.sync.lastSync()) untracked(() => void this.dashboard.load());
    });
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
