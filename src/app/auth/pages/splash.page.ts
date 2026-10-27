import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthFacade } from '../services/auth.facade';

/** Tiempo mínimo en pantalla: el campesino sube serio y sonríe (~1,1 s); que la sonrisa se vea. */
const MIN_VISIBLE_MS = 2000;
/** Duración del fundido de salida antes de navegar (igual que `.splash--leaving`). */
const LEAVE_MS = 250;

/**
 * Splash — arranque animado mientras se verifica la sesión (Design System §1.0). El splash
 * nativo es solo un instante en blanco; aquí entra el fondo de ramas de café, arriba el
 * nombre y los granos de carga, y abajo el campesino de la marca: sube serio y, mientras
 * carga, sonríe con un leve asentimiento y un halo verde detrás. Luego se va a Login o Inicio.
 *
 * Las dos caras son la misma ilustración (assets/brand): la seria lleva la boca cerrada y
 * la sonriente se funde encima. Con movimiento reducido aparece directamente sonriendo.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content [fullscreen]="true" class="splash" [class.splash--leaving]="leaving()">
      <div class="splash__bg" aria-hidden="true"></div>

      <div class="splash__top">
        <p class="splash__name">CosechApp</p>
        <div class="splash__loader" role="status" aria-label="Cargando">
          <span></span><span></span><span></span>
        </div>
      </div>

      <!-- Apoyado en el borde de abajo, como un retrato: el corte del busto no se ve. -->
      <div class="splash__farmer">
        <div class="splash__halo" aria-hidden="true"></div>
        <div class="splash__portrait">
          <img class="splash__face" src="assets/brand/farmer-serious.webp" alt="" aria-hidden="true" />
          <img class="splash__face splash__face--smile" src="assets/brand/farmer-smile.webp" alt="CosechApp" />
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

    /* Arriba: el nombre y los granos, centrados en el espacio libre sobre el campesino
       (que mide lo mismo de alto que de ancho). */
    .splash__top {
      position: absolute;
      top: 0;
      right: 0;
      bottom: min(92vw, 420px);
      left: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
      padding-top: env(safe-area-inset-top, 0px);
    }
    .splash__name {
      margin: 0;
      font-family: var(--font-family-display);
      font-size: 2.5rem;
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.01em;
      color: var(--color-primary-ink);
      opacity: 0;
      animation: fade-in 500ms ease-out 150ms forwards;
    }
    .splash__loader {
      display: flex;
      gap: 10px;
      opacity: 0;
      animation: fade-in 400ms ease-out 700ms forwards;
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

    /* Abajo: el campesino, centrado y apoyado en el borde de la pantalla. */
    .splash__farmer {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      width: min(92vw, 420px);
      margin: 0 auto;
    }
    /* El halo verde que se enciende cuando sonríe. */
    .splash__halo {
      position: absolute;
      inset: -12% -18% 0;
      background: radial-gradient(closest-side at 50% 55%, rgba(121, 166, 54, 0.30), rgba(121, 166, 54, 0));
      opacity: 0;
      animation: fade-in 600ms ease-out 1100ms forwards;
    }
    /* Sube desde abajo, serio; al sonreír, asiente apenas (desde la base, como un busto). */
    .splash__portrait {
      position: relative;
      aspect-ratio: 833 / 834;
      transform-origin: 50% 100%;
      opacity: 0;
      animation:
        rise 700ms cubic-bezier(0.22, 1, 0.36, 1) 200ms forwards,
        nod 520ms ease-in-out 1100ms;
    }
    .splash__face {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .splash__face--smile {
      opacity: 0;
      animation: fade-in 350ms ease-out 1100ms forwards;
    }

    @keyframes bg-in {
      from { opacity: 0; transform: scale(1.06); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(40px); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes nod {
      0%, 100% { transform: none; }
      40%      { transform: scale(1.03) rotate(-1.5deg); }
    }
    @keyframes fade-in {
      to { opacity: 1; }
    }
    @keyframes bean-pulse {
      0%, 100% { opacity: 0.35; transform: scale(0.8); }
      50%      { opacity: 1; transform: scale(1.1); }
    }

    /* Sin movimiento: aparece directamente sonriendo, con un fundido. */
    @media (prefers-reduced-motion: reduce) {
      .splash__bg, .splash__name, .splash__loader, .splash__portrait, .splash__halo {
        animation: fade-in 300ms ease-out forwards;
      }
      .splash__face--smile {
        animation: none;
        opacity: 1;
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
