import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonImg } from '@ionic/angular/ion-img';
import { IonAvatar } from '@ionic/angular/ion-avatar';
import { IonToast } from '@ionic/angular/ion-toast';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline, refreshCircleOutline } from 'ionicons/icons';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';

/**
 * Pantalla Login — Placeholder para Tarea 1.2.
 * Contenido según Design System 1.1:
 * - Campo cédula, campo contraseña
 * - Foto de perfil (opcional)
 * - Botón "Ingresar" / enlace "Crear cuenta"
 * - Sin campos de verificación adicionales (sin correo ni teléfono)
 * Componentes atómicos shared: app-input, app-button-primary
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonInput, IonItem, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonImg, IonAvatar, IonToast],
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
            <ion-avatar class="avatar-large" (click)="pickProfilePhoto()">
              <img *ngIf="profilePhoto()" [src]="profilePhoto()" alt="Foto de perfil" />
              <ion-icon *ngIf="!profilePhoto()" name="person-outline" size="large"></ion-icon>
            </ion-avatar>
            <p class="text-level-4 ion-margin-top">Foto opcional (tap para cambiar)</p>
          </div>

          <!-- Formulario -->
          <form (ngSubmit)="onLogin()" #loginForm="ngForm">
            <ion-item lines="full" class="input-item">
              <ion-label position="floating">Cédula</ion-label>
              <ion-input
                type="text"
                name="nationalId"
                [(ngModel)]="nationalId"
                required
                minlength="5"
                maxlength="20"
                #nationalIdInput="ngModel"
                inputmode="numeric"
                autocomplete="username"
              ></ion-input>
            </ion-item>
            <div *ngIf="nationalIdInput.invalid && nationalIdInput.touched" class="error-text text-level-4">
              La cédula debe tener entre 5 y 20 caracteres
            </div>

            <ion-item lines="full" class="input-item">
              <ion-label position="floating">Contraseña</ion-label>
              <ion-input
                [type]="showPassword() ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                required
                minlength="6"
                maxlength="50"
                #passwordInput="ngModel"
                autocomplete="current-password"
              ></ion-input>
              <ion-button fill="clear" slot="end" (click)="togglePassword()">
                <ion-icon [name]="showPassword() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
              </ion-button>
            </ion-item>
            <div *ngIf="passwordInput.invalid && passwordInput.touched" class="error-text text-level-4">
              La contraseña debe tener al menos 6 caracteres
            </div>

            <ion-button
              expand="block"
              fill="solid"
              color="primary"
              type="submit"
              class="submit-btn"
              [disabled]="loginForm.invalid || isLoading()"
            >
              <ion-icon *ngIf="isLoading()" name="circular-outline" slot="start" class="spin"></ion-icon>
              <ion-icon *ngIf="!isLoading()" name="log-in-outline" slot="start"></ion-icon>
              {{ isLoading() ? 'Ingresando...' : 'Ingresar' }}
            </ion-button>
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
    .avatar-large {
      width: 96dp;
      height: 96dp;
      --border-radius: var(--avatar-radius);
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      margin: 0 auto;
      cursor: pointer;
      border: 2dp solid var(--color-border);
    }
    .avatar-large img {
      width: 100%;
      height: 100%;
      border-radius: var(--avatar-radius);
      object-fit: cover;
    }
    .input-item {
      --padding-start: var(--input-padding-h);
      --padding-end: var(--input-padding-h);
      --border-radius: var(--input-radius);
      min-height: var(--input-min-height);
      --background: var(--color-surface);
      margin-bottom: var(--spacing-xs);
    }
    .error-text {
      margin: -8dp 0 var(--spacing-sm) 16dp;
      font-size: var(--font-size-xs);
    }
    .submit-btn {
      --border-radius: var(--radius-full);
      height: var(--btn-primary-height);
      min-height: var(--btn-primary-height);
      margin-top: var(--spacing-md);
      font-family: var(--font-family-display);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .register-link {
      font-family: var(--font-family-body);
    }
  `],
})
export class LoginPage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  nationalId = '';
  password = '';
  profilePhoto = signal<string | null>(null);
  showPassword = signal(false);
  isLoading = this.authFacade.isLoading;
  showError = signal(false);
  errorMessage = signal('');

  constructor() {
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, logInOutline, refreshCircleOutline });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

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