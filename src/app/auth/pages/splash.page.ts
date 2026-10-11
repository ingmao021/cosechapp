import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthFacade } from '../services/auth.facade';

/**
 * Capas de resources/img/Cosecha_inicio_app.png, de atrás hacia adelante. Todas comparten
 * el lienzo de 1414×2000, así que apiladas con el mismo object-fit quedan alineadas.
 */
const LAYERS = ['esquinas', 'ramas', 'saco', 'granos', 'titulo'] as const;
/** Entrada completa (el título termina a ~2,1 s) más una pausa corta para verlo armado. */
const BRAND_ANIMATION_MS = 2600;
/** Si alguna capa no carga, no retener al usuario. */
const IMAGE_LOAD_TIMEOUT_MS = 2000;

/**
 * Splash — fondo de inicio que se arma por capas mientras se verifica la sesión:
 * marca de agua (esquinas y ramas) → saco → granos que se riegan → título escrito
 * de izquierda a derecha.
 *
 * Flujo:
 * 1. El splash nativo (ícono sobre blanco) cubre el arranque del WebView.
 * 2. Cuando las capas cargaron se oculta el nativo y empieza la animación; ambos
 *    fondos son blancos, así que el relevo no se nota.
 * 3. Se navega cuando terminan las dos cosas: la animación y AuthFacade.initSession().
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content [fullscreen]="true" class="splash">
      <div class="splash__art" [class.is-playing]="playing()" role="img" aria-label="CosechApp">
        @for (layer of layers; track layer) {
          <img
            class="splash__layer splash__layer--{{ layer }}"
            src="assets/brand/inicio/{{ layer }}.webp"
            alt=""
            (load)="onLayerReady()"
            (error)="onLayerReady()"
          />
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .splash {
      --background: #FFFFFF;
    }
    .splash__art {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    .splash__layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      will-change: transform, opacity;
    }
    /* Cada capa queda en su primer fotograma (fill both) hasta que cargan todas. */
    .splash__art:not(.is-playing) .splash__layer {
      animation-play-state: paused;
    }

    .splash__layer--esquinas {
      animation: splash-watermark 700ms ease-out both;
    }
    .splash__layer--ramas {
      animation: splash-watermark 800ms ease-out 150ms both;
    }
    .splash__layer--saco {
      transform-origin: 55% 45%;
      animation:
        splash-sack 850ms cubic-bezier(.2, .8, .2, 1) 250ms both,
        splash-breathe 2400ms ease-in-out 1600ms infinite;
    }
    .splash__layer--granos {
      animation: splash-spill 700ms cubic-bezier(.2, .8, .2, 1) 800ms both;
    }
    .splash__layer--titulo {
      animation: splash-write 1400ms cubic-bezier(.45, 0, .25, 1) 700ms both;
    }

    @keyframes splash-watermark {
      from { opacity: 0; transform: scale(1.06); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes splash-sack {
      from { opacity: 0; transform: translateY(24px) scale(.92); filter: blur(8px); }
      to   { opacity: 1; transform: none; filter: none; }
    }
    @keyframes splash-breathe {
      0%, 100% { transform: none; }
      50%      { transform: scale(1.015); }
    }
    /* Los granos salen de la boca del saco (arriba a la derecha) y caen a su sitio. */
    @keyframes splash-spill {
      from { opacity: 0; transform: translate(5%, -4%) rotate(-6deg) scale(.9); }
      60%  { opacity: 1; }
      to   { opacity: 1; transform: none; }
    }
    @keyframes splash-write {
      from { opacity: 0; clip-path: inset(0 100% 0 0); transform: translateY(6px); }
      20%  { opacity: 1; }
      to   { opacity: 1; clip-path: inset(0 0 0 0); transform: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .splash__layer,
      .splash__layer--saco {
        animation: splash-fade 300ms ease-out both;
      }
      @keyframes splash-fade {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    }
  `],
})
export class SplashPage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  protected readonly layers = LAYERS;
  protected readonly playing = signal(false);

  private pendingLayers = LAYERS.length;
  private resolveArtReady!: () => void;
  private readonly artReady = new Promise<void>((resolve) => (this.resolveArtReady = resolve));

  async ngOnInit(): Promise<void> {
    setTimeout(() => this.startAnimation(), IMAGE_LOAD_TIMEOUT_MS);

    const animationDone = this.artReady.then(() => delay(BRAND_ANIMATION_MS));
    const [destination] = await Promise.all([this.authFacade.initSession(), animationDone]);

    await this.router.navigateByUrl(destination, { replaceUrl: true });
  }

  onLayerReady(): void {
    if (--this.pendingLayers === 0) this.startAnimation();
  }

  private startAnimation(): void {
    if (this.playing()) return;
    this.playing.set(true);
    this.resolveArtReady();
    SplashScreen.hide({ fadeOutDuration: 150 }).catch(() => { /* web: no hay splash nativo */ });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
