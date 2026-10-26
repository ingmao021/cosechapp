import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowForward, idCardOutline, lockClosedOutline } from 'ionicons/icons';
import { AppInputComponent, AppButtonPrimaryComponent } from '../../shared';
import { AuthFacade } from '../services/auth.facade';
import { AuthTopBarComponent } from './auth-top-bar.component';

/**
 * Login — Design System §1.1: logo, cédula, contraseña, "Ingresar" y enlace a "Crear cuenta".
 * Sin foto ni campos extra (baja alfabetización digital). Los errores se muestran en
 * pantalla y en español, no como toast efímero.
 * Arriba: "volver" cierra la app (es la primera pantalla) y el rayo dice si hay señal.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonIcon, AppInputComponent, AppButtonPrimaryComponent, AuthTopBarComponent],
  styleUrl: './auth-layout.css',
  template: `
    <ion-content class="auth">
      <div class="auth__hero" aria-hidden="true"></div>
      <main class="auth__body">
        <app-auth-top-bar backLabel="Salir de la app" (back)="exitApp()"></app-auth-top-bar>

        <header class="auth__brand">
          <img class="auth__sack" src="assets/brand/splash-sack.webp" alt="" aria-hidden="true" />
          <p class="auth__wordmark">CosechApp</p>
          <p class="auth__tagline">Pesadas y pagos de tu cosecha, con o sin señal.</p>
        </header>

        <section class="auth__panel" aria-labelledby="login-title">
          <h1 id="login-title" class="auth__title">Ingresar</h1>

          <form class="auth__form" (ngSubmit)="onLogin()" #loginForm="ngForm" novalidate>
            <app-input
              label="Cédula"
              iconStart="id-card-outline"
              name="nationalId"
              [(ngModel)]="nationalId"
              required
              minlength="5"
              maxlength="20"
              inputmode="numeric"
              autocomplete="username"
              enterkeyhint="next"
              errorMessage="Escribe tu cédula (mínimo 5 dígitos)."
            ></app-input>

            <app-input
              label="Contraseña"
              iconStart="lock-closed-outline"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              maxlength="50"
              autocomplete="current-password"
              enterkeyhint="go"
              errorMessage="La contraseña tiene al menos 6 caracteres."
            ></app-input>

            @if (errorMessage()) {
              <p class="form-error" role="alert">
                <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
                <span>{{ errorMessage() }}</span>
              </p>
            }

            <app-button-primary
              class="auth__submit"
              type="submit"
              [loading]="isLoading()"
              [disabled]="loginForm.invalid"
              loadingText="Ingresando..."
              iconEnd="arrow-forward"
            >
              Ingresar
            </app-button-primary>
          </form>
        </section>

        <footer class="auth__switch">
          <span>¿Aún no tienes cuenta?</span>
          <ion-button fill="clear" size="small" (click)="goToRegister()">Crear cuenta</ion-button>
        </footer>
      </main>
    </ion-content>
  `,
})
export class LoginPage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly nationalId = signal('');
  readonly password = signal('');
  readonly isLoading = this.authFacade.isLoading;
  /** Arranca con el aviso de sesión expirada, si Splash lo dejó. */
  readonly errorMessage = signal<string | null>(this.authFacade.error());

  constructor() {
    addIcons({ alertCircleOutline, arrowForward, idCardOutline, lockClosedOutline });
  }

  /** Login es la primera pantalla: "volver" no tiene a dónde ir, así que cierra la app.
   *  En web (desarrollo) no hay app que cerrar: se ignora sin error. */
  exitApp(): void {
    void import('@capacitor/app').then(({ App }) => App.exitApp()).catch(() => undefined);
  }

  async onLogin(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.authFacade.login(this.nationalId().trim(), this.password());
    } catch {
      this.errorMessage.set(this.authFacade.error());
    }
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
