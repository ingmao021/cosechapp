import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthFacade } from '../services/auth.facade';

/**
 * Splash — mientras se verifica la sesión solo se ve el logo del splash nativo (ícono de la
 * app sobre blanco). Esta página no muestra nada propio: el splash nativo sigue encima hasta
 * que se navega a Login o a Inicio, y ahí se oculta con un fundido corto.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [IonContent],
  template: `<ion-content [fullscreen]="true" class="splash"></ion-content>`,
  styles: [`
    .splash {
      --background: #FFFFFF;
    }
  `],
})
export class SplashPage implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    try {
      const destination = await this.authFacade.initSession();
      await this.router.navigateByUrl(destination, { replaceUrl: true });
    } finally {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => { /* web: no hay splash nativo */ });
    }
  }
}
