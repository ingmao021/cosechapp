import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/ion-content';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthFacade } from '../services/auth.facade';

/**
 * Página Splash — Pantalla de arranque con Cosech.png nativo.
 *
 * Flujo:
 * 1. Capacitor muestra el splash nativo (configurado en capacitor.config.ts) ANTES de que Angular cargue.
 * 2. Esta página se monta mientras AuthFacade.initSession() verifica la sesión contra el backend.
 * 3. Al terminar initSession(), el facade navega a /home o /auth/login.
 * 4. Esta página solo existe para evitar parpadeo blanco si el WebView tarda en hidratar;
 *    el splash real es el nativo de Capacitor.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule, IonContent],
  template: `
    <ion-content class="splash-content" [class.hidden]="navigated">
      <!-- Contenido vacío: el splash real es el nativo de Capacitor (Cosech.png).
           Esto evita flash blanco si Angular tarda en bootstrap. -->
    </ion-content>
  `,
  styles: [`
    .splash-content {
      --background: var(--color-background);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .splash-content.hidden {
      display: none;
    }
  `],
})
export class SplashPage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  protected navigated = false;

  constructor() {
    // Effect que reacciona cuando initSession termina (isLoading pasa a false)
    effect(() => {
      if (!this.authFacade.isLoading() && !this.navigated) {
        this.navigated = true;
        // Ocultar splash nativo de Capacitor una vez navegado
        SplashScreen.hide().catch(() => { /* ignorar */ });
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // Iniciar verificación de sesión (lee token + GET /auth/me)
    await this.authFacade.initSession();
  }
}