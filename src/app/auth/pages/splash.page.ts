import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthFacade } from '../services/auth.facade';

/** Duración de la animación de marca (begin 0.3s + dur 2.6s del SVG) más una pausa corta. */
const BRAND_ANIMATION_MS = 3300;
/** Si el SVG no carga, no retener al usuario. */
const IMAGE_LOAD_TIMEOUT_MS = 2000;

/**
 * Splash — animación de marca (CosechAPP_animado.svg) mientras se verifica la sesión.
 *
 * Flujo:
 * 1. El splash nativo (fondo blanco liso) cubre el arranque del WebView.
 * 2. Cuando el SVG está listo se oculta el nativo; como ambos son blancos no hay salto.
 * 3. Se navega cuando terminan las dos cosas: la animación y AuthFacade.initSession().
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content [fullscreen]="true" class="splash">
      <img
        class="splash__art"
        src="assets/brand/cosechapp-animado.svg"
        alt="CosechApp"
        (load)="onArtReady()"
        (error)="onArtReady()"
      />
    </ion-content>
  `,
  styles: [`
    .splash {
      --background: #FFFFFF;
    }
    .splash__art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
  `],
})
export class SplashPage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  private resolveArtReady!: () => void;
  private readonly artReady = new Promise<void>((resolve) => (this.resolveArtReady = resolve));

  async ngOnInit(): Promise<void> {
    setTimeout(() => this.onArtReady(), IMAGE_LOAD_TIMEOUT_MS);

    const animationDone = this.artReady.then(() => delay(BRAND_ANIMATION_MS));
    const [destination] = await Promise.all([this.authFacade.initSession(), animationDone]);

    await this.router.navigateByUrl(destination, { replaceUrl: true });
  }

  onArtReady(): void {
    this.resolveArtReady();
    SplashScreen.hide({ fadeOutDuration: 150 }).catch(() => { /* web: no hay splash nativo */ });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
