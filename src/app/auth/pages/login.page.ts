import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonToast } from '@ionic/angular/ion-toast';
import { IonButton } from '@ionic/angular/ion-button';
import { AppInputComponent, AppButtonPrimaryComponent, AppAvatarComponent } from '../../shared';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';

/**
 * Pantalla Login — Tarea 1.2.
 * Contenido según Design System 1.1:
 * - Campo cédula, campo contraseña
 * - Foto de perfil (opcional)
 * - Botón "Ingresar" / enlace "Crear cuenta"
 * - Sin campos de verificación adicionales (sin correo ni teléfono)
 * Componentes atómicos shared: app-input, app-button-primary, app-avatar
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonToast,
    IonButton,
    AppInputComponent,
    AppButtonPrimaryComponent,
    AppAvatarComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Ingresar</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="auth-card">
        <ion-card-header class="text-center">
          <ion-card-title class="text-level-1">CosechApp</ion-card-title>
          <ion-card-subtitle class="text-level-4">Inicia sesión para continuar</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <!-- Foto de perfil opcional -->
          <div class="avatar-section text-center">
            <app-avatar
              [src]="profilePhoto()"
              [fallbackIcon]="'person-outline'"
              [clickable]="true"
              (avatarClick)="pickProfilePhoto()"
            ></app-avatar>
            <p class="text-level-4 ion-margin-top">Foto opcional (tap para cambiar)</p>
          </div>

          <!-- Formulario -->
          <form (ngSubmit)="onLogin()" #loginForm="ngForm">
            <app-input
              label="Cédula"
              type="text"
              name="nationalId"
              [(ngModel)]="nationalId"
              required
              minlength="5"
              maxlength="20"
              inputmode="numeric"
              autocomplete="username"
              #nationalIdInput
            ></app-input>

            <app-input
              label="Contraseña"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              maxlength="50"
              autocomplete="current-password"
              #passwordInput
            ></app-input>

            <app-button-primary
              type="submit"
              [loading]="isLoading()"
              [disabled]="loginForm.invalid"
              loadingText="Ingresando..."
              iconStart="log-in-outline"
            >
              Ingresar
            </app-button-primary>
          </form>

          <!-- Enlace registro -->
          <div class="register-link text-center ion-margin-top">
            <span class="text-level-4">¿No tienes cuenta? </span>
            <ion-button fill="clear" color="primary" size="small" (click)="goToRegister()">
              Crear cuenta
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Toast error -->
      <ion-toast
        [isOpen]="showError()"
        [message]="errorMessage()"
        duration="3000"
        position="bottom"
        color="danger"
        (didDismiss)="showError.set(false)"
      ></ion-toast>
    </ion-content>
  `,
  styles: [`
    .auth-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      max-width: 400px;
      margin: var(--spacing-xl) auto;
    }
    .text-center {
      text-align: center;
    }
    .avatar-section {
      margin-bottom: var(--spacing-lg);
    }
    .register-link {
      font-family: var(--font-family-body);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
  `],
})
export class LoginPage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  nationalId = '';
  password = '';
  profilePhoto = signal<string | null>(null);
  isLoading = this.authFacade.isLoading;
  showError = signal(false);
  errorMessage = signal('');

  pickProfilePhoto(): void {
    // TODO: implementar selección de foto (camera/gallery) - opcional
    console.log('Seleccionar foto de perfil');
  }

  async onLogin(): Promise<void> {
    try {
      await this.authFacade.login(this.nationalId, this.password);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Error al iniciar sesión');
      this.showError.set(true);
    }
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}