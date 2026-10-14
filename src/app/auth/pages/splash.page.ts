import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthFacade } from '../services/auth.facade';

/** Tiempo mínimo en pantalla, para que la entrada del fondo y del costal se vea completa. */
const MIN_VISIBLE_MS = 1800;
/** Duración del fundido de salida antes de navegar (igual que `.splash--leaving`). */
const LEAVE_MS = 250;

/**
 * Splash — arranque animado mientras se verifica la sesión. El splash nativo es solo un
 * instante en blanco; aquí aparece el fondo de café, luego el costal sube y aparece, y los
 * granos de carga laten hasta que se sabe a dónde ir (Login o Inicio).
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content [fullscreen]="true" class="splash" [class.splash--leaving]="leaving()">
      <div class="splash__bg" aria-hidden="true"></div>
      <div class="splash__center">
        <img class="splash__sack" src="assets/brand/splash-sack.webp" alt="CosechApp" />
        <div class="splash__loader" role="status" aria-label="Cargando">
          <span></span><span></span><span></span>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .splash {
      --background: #FFFFFF;
      transition: opacity 250ms ease-out;
    }
    .splash--leaving {
      opacity: 0;
    }
    .splash__bg {
      position: absolute;
      inset: 0;
      background: url('/assets/brand/splash-bg.webp') center / cover no-repeat;
      opacity: 0;
      animation: bg-in 700ms ease-out forwards;
    }
    .splash__center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
    }
    /* Tamaño mediano: acompaña al fondo sin llenar la pantalla. A más de ~180dp la
       acuarela se ve tosca (se nota el escalado y pesa más que la marca). */
    .splash__sack {
      width: min(42vw, 180px);
      opacity: 0;
      animation:
        sack-in 800ms cubic-bezier(0.22, 1, 0.36, 1) 350ms forwards,
        sack-breathe 2400ms ease-in-out 1150ms infinite;
    }
    .splash__loader {
      display: flex;
      gap: 10px;
      opacity: 0;
      animation: fade-in 400ms ease-out 1000ms forwards;
    }
    .splash__loader span {
      width: 10px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-secondary);
      animation: bean-pulse 1100ms ease-in-out infinite;
    }
    .splash__loader span:nth-child(2) { animation-delay: 180ms; }
    .splash__loader span:nth-child(3) { animation-delay: 360ms; }

    @keyframes bg-in {
      from { opacity: 0; transform: scale(1.06); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes sack-in {
      from { opacity: 0; transform: translateY(24px) scale(0.88); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes sack-breathe {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.03); }
    }
    @keyframes fade-in {
      to { opacity: 1; }
    }
    @keyframes bean-pulse {
      0%, 100% { opacity: 0.35; transform: scale(0.8); }
      50%      { opacity: 1; transform: scale(1.1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .splash__bg, .splash__sack, .splash__loader {
        animation: fade-in 300ms ease-out forwards;
      }
      .splash__loader span {
        animation: none;
        opacity: 0.7;
      }
    }
  `],
})
export class SplashPage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly leaving = signal(false);

  async ngOnInit(): Promise<void> {
    // El nativo (blanco liso) se quita enseguida para que se vea la animación.
    SplashScreen.hide({ fadeOutDuration: 150 }).catch(() => { /* web: no hay splash nativo */ });
    try {
      const [destination] = await Promise.all([this.authFacade.initSession(), wait(MIN_VISIBLE_MS)]);
      this.leaving.set(true);
      await wait(LEAVE_MS);
      await this.router.navigateByUrl(destination, { replaceUrl: true });
    } finally {
      SplashScreen.hide().catch(() => { /* web: no hay splash nativo */ });
    }
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
