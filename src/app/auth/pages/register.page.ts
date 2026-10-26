import { Component, computed, inject, signal } from '@angular/core';
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
 * Registro — Design System §1.1: mismos campos que Login más confirmación de contraseña.
 * La foto de perfil se agrega después, desde Perfil (§1.12).
 * Arriba: "volver" regresa a Login y el rayo dice si hay señal.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, IonContent, IonButton, IonIcon, AppInputComponent, AppButtonPrimaryComponent, AuthTopBarComponent],
  styleUrl: './auth-layout.css',
  template: `
    <ion-content class="auth">
      <div class="auth__hero" aria-hidden="true"></div>
      <main class="auth__body">
        <app-auth-top-bar backLabel="Volver a ingresar" (back)="goToLogin()"></app-auth-top-bar>

        <header class="auth__brand">
          <img class="auth__sack" src="assets/brand/splash-sack.webp" alt="" aria-hidden="true" />
          <p class="auth__wordmark">CosechApp</p>
          <p class="auth__tagline">Crea tu cuenta con tu cédula. No necesitas correo.</p>
        </header>

        <section class="auth__panel" aria-labelledby="register-title">
          <h1 id="register-title" class="auth__title">Crear cuenta</h1>

          <form class="auth__form" (ngSubmit)="onRegister()" #registerForm="ngForm" novalidate>
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
              autocomplete="new-password"
              helperText="Mínimo 6 caracteres. Guárdala en un lugar seguro."
              errorMessage="Usa al menos 6 caracteres."
            ></app-input>

            <app-input
              label="Confirmar contraseña"
              iconStart="lock-closed-outline"
              type="password"
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              required
              autocomplete="new-password"
              [errorMessage]="passwordMismatch() ? 'Las contraseñas no coinciden.' : 'Repite la contraseña.'"
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
              [disabled]="registerForm.invalid || passwordMismatch()"
              loadingText="Creando cuenta..."
              iconEnd="arrow-forward"
            >
              Crear cuenta
            </app-button-primary>
          </form>
        </section>

        <footer class="auth__switch">
          <span>¿Ya tienes cuenta?</span>
          <ion-button fill="clear" size="small" (click)="goToLogin()">Ingresar</ion-button>
        </footer>
      </main>
    </ion-content>
  `,
})
export class RegisterPage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly nationalId = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly isLoading = this.authFacade.isLoading;
  readonly errorMessage = signal<string | null>(null);

  readonly passwordMismatch = computed(
    () => !!this.confirmPassword() && this.password() !== this.confirmPassword(),
  );

  constructor() {
    addIcons({ alertCircleOutline, arrowForward, idCardOutline, lockClosedOutline });
  }

  async onRegister(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.authFacade.register(this.nationalId().trim(), this.password());
    } catch {
      this.errorMessage.set(this.authFacade.error());
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}
