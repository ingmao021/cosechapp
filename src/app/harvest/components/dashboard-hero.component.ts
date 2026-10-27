import { Component, computed, inject, output } from '@angular/core';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  cloudDoneOutline,
  cloudOfflineOutline,
  cloudUploadOutline,
  flagOutline,
  removeOutline,
  trendingDownOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { DashboardFacade } from '../services/dashboard.facade';
import { HarvestFacade } from '../services/harvest.facade';
import { NetworkService } from '../../network/services/network.service';
import { SyncFacade } from '../../sync/services/sync.facade';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { formatKilos } from '../../shared/utils';

/**
 * Organismo de Inicio: el bloque principal. Contesta "¿cómo va mi cosecha hoy?": la cosecha
 * activa con su día, los kilos de hoy en grande y cómo van frente a ayer, el estado de
 * envío y "Continuar" (emite `continue`; la página decide a dónde ir).
 *
 * Es el único bloque en color: verde hoja profundo con el dibujo de ramas de café del
 * splash y del login, apenas visible. El resto de Inicio queda en tarjetas blancas.
 */
@Component({
  selector: 'app-dashboard-hero',
  standalone: true,
  imports: [IonButton, IonIcon, DateFormatPipe, KilosPipe],
  template: `
    <section class="hero" aria-labelledby="hero-name">
      <p class="hero__eyebrow">Cosecha activa · Día <span class="num">{{ dashboard.harvestDay() }}</span></p>
      <h2 id="hero-name" class="hero__name">{{ harvestFacade.activeHarvestName() }}</h2>

      <p class="hero__today">
        <span class="hero__figure num">{{ dashboard.todayKilograms() | kilos: false }}</span>
        <!-- El espacio va dentro del texto (el lector de pantalla dice "157,3 kg hoy"); el
             hueco visual lo da el gap del flex. -->
        <span class="hero__unit"> kg</span>
        <span class="hero__label"> hoy</span>
      </p>

      <div class="hero__compare">
        @if (delta(); as delta) {
          <span class="hero__pill">
            <ion-icon [name]="delta.icon" aria-hidden="true"></ion-icon>
            {{ delta.text }}
          </span>
        }
        @if (dashboard.harvestDay() > 1 && dashboard.yesterdayKilograms() !== null) {
          <span class="hero__yesterday">Ayer: {{ dashboard.yesterdayKilograms() | kilos }}</span>
        }
      </div>

      <p class="hero__status" [class.hero__status--warn]="sync.pendingCount() > 0 || !network.isOnline()" role="status">
        @if (sync.pendingCount() > 0) {
          <ion-icon name="cloud-upload-outline" aria-hidden="true"></ion-icon>
          {{ sync.pendingCount() }} {{ sync.pendingCount() === 1 ? 'pesada' : 'pesadas' }} por enviar
        } @else if (!network.isOnline()) {
          <ion-icon name="cloud-offline-outline" aria-hidden="true"></ion-icon>
          Sin conexión · se guarda en el teléfono
        } @else if (sync.lastSync()) {
          <ion-icon name="cloud-done-outline" aria-hidden="true"></ion-icon>
          Todo enviado · {{ sync.lastSync() | dateFormat: 'time' }}
        } @else {
          <ion-icon name="cloud-done-outline" aria-hidden="true"></ion-icon>
          En línea
        }
      </p>

      <ion-button expand="block" class="hero__continue" (click)="continue.emit()">
        Continuar
        <ion-icon name="arrow-forward" slot="end" aria-hidden="true"></ion-icon>
      </ion-button>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
    /* isolation: el dibujo se mezcla solo con el verde de la tarjeta, no con la página. */
    .hero {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      padding: 20px var(--spacing-md) var(--spacing-md);
      border-radius: var(--radius-lg);
      background: var(--color-leaf-deep);
      box-shadow: var(--shadow-card);
      color: var(--color-on-leaf);
      font-family: var(--font-family-body);
    }
    /* Las ramas de café del splash, invertidas y aclaradas sobre el verde: textura, no
       adorno. Se desvanecen hacia la izquierda para que el texto quede sobre verde limpio. */
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: url('/assets/brand/splash-bg.webp') right -60px top -30px / 170% auto no-repeat;
      filter: invert(1) brightness(3.5);
      mix-blend-mode: screen;
      opacity: 0.26;
      -webkit-mask-image: linear-gradient(100deg, transparent 30%, #000 75%);
      mask-image: linear-gradient(100deg, transparent 30%, #000 75%);
      pointer-events: none;
    }
    .hero__eyebrow {
      margin: 0;
      font-size: var(--font-size-footnote);
      font-weight: var(--font-weight-medium);
      color: var(--color-on-leaf-muted);
    }
    .hero__name {
      margin: 2px 0 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      letter-spacing: -0.01em;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    /* La cifra del día, en Zilla Slab como en el cuaderno de la finca: lo que se busca con la mirada. */
    .hero__today {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0 6px;
      margin: 18px 0 0;
    }
    .hero__figure {
      font-family: var(--font-family-display);
      font-size: clamp(2.5rem, 13vw, 3.25rem);
      font-weight: var(--font-weight-bold);
      line-height: 1;
      overflow-wrap: anywhere;
    }
    .hero__unit {
      font-family: var(--font-family-display);
      font-size: 1.375rem;
      font-weight: var(--font-weight-bold);
    }
    .hero__label {
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-medium);
      color: var(--color-on-leaf-muted);
    }
    .hero__compare {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-sm) 12px;
      margin-top: 12px;
    }
    .hero__pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 32px;
      padding: 0 12px 0 10px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.14);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
    }
    .hero__pill ion-icon {
      flex-shrink: 0;
      font-size: 18px;
    }
    .hero__yesterday {
      font-size: var(--font-size-sm);
      color: var(--color-on-leaf-muted);
    }
    .hero__status {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: var(--spacing-md) 0 12px;
      font-size: var(--font-size-footnote);
      color: var(--color-on-leaf-muted);
    }
    .hero__status ion-icon {
      flex-shrink: 0;
      font-size: 16px;
    }
    /* Pendiente de enviar o sin señal: ámbar claro, legible sobre el verde (≈7:1). */
    .hero__status--warn {
      color: #FFE3A3;
    }
    /* Botón claro sobre el verde: la acción principal del bloque, sin competir con la cifra. */
    .hero__continue {
      --background: var(--color-on-leaf);
      --background-activated: #E8EFDC;
      --background-focused: #E8EFDC;
      --color: var(--color-primary-ink);
      --border-radius: var(--radius-full);
      --box-shadow: none;
      height: 52px;
      min-height: 52px;
      margin: 0;
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
    }
  `],
})
export class DashboardHeroComponent {
  protected readonly dashboard = inject(DashboardFacade);
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly sync = inject(SyncFacade);
  protected readonly network = inject(NetworkService);

  /** "Continuar": seguir con la cosecha (pesar, pagar). */
  readonly continue = output<void>();

  /** Hoy frente a ayer, en palabras (el ícono y el color solo acompañan). */
  protected readonly delta = computed(() => {
    if (this.dashboard.harvestDay() <= 1) return { icon: 'flag-outline', text: 'Primer día de la cosecha' };
    const yesterday = this.dashboard.yesterdayKilograms();
    if (yesterday === null) return null;
    const diff = Math.round((this.dashboard.todayKilograms() - yesterday) * 1000) / 1000;
    if (diff === 0) return { icon: 'remove-outline', text: 'Igual que ayer' };
    return diff > 0
      ? { icon: 'trending-up-outline', text: `${formatKilos(diff)} más que ayer` }
      : { icon: 'trending-down-outline', text: `${formatKilos(-diff)} menos que ayer` };
  });

  constructor() {
    addIcons({
      arrowForward,
      cloudDoneOutline,
      cloudOfflineOutline,
      cloudUploadOutline,
      flagOutline,
      removeOutline,
      trendingDownOutline,
      trendingUpOutline,
    });
  }
}
