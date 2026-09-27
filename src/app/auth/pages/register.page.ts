import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
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
import { personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, personAddOutline, arrowBackOutline, refreshCircleOutline } from 'ionicons/icons';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';

/**
 * Pantalla Registro — Placeholder para Tarea 1.2.
 * Mismos campos que login + confirmación de contraseña.
 * Foto de perfil opcional.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonIcon, IonInput, IonItem, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonImg, IonAvatar, IonToast],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="text-level-1">Crear cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="auth-card">
        <ion-card-header class="text-center">
          <ion-card-title class="text-level-1">CosechApp</ion-card-title>
          <ion-card-subtitle class="text-level-4">Regístrate para empezar</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <!-- Foto de perfil opcional -->
          <div class="avatar-section text-center">
            <ion-avatar class="avatar-large" (click)="pickProfilePhoto()">
              <img *ngIf="profilePhoto()" [src]="profilePhoto()" alt="Foto de perfil" />
              <ion-icon *ngIf="!profilePhoto()" name="person-add-outline" size="large"></ion-icon>
            </ion-avatar>
            <p class="text-level-4 ion-margin-top">Foto opcional (tap para cambiar)</p>
          </div>

          <!-- Formulario -->
          <form (ngSubmit)="onRegister()" #registerForm="ngForm">
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
                autocomplete="new-password"
              ></ion-input>
              <ion-button fill="clear" slot="end" (click)="togglePassword()">
                <ion-icon [name]="showPassword() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
              </ion-button>
            </ion-item>
            <div *ngIf="passwordInput.invalid && passwordInput.touched" class="error-text text-level-4">
              La contraseña debe tener al menos 6 caracteres
            </div>

            <ion-item lines="full" class="input-item">
              <ion-label position="floating">Confirmar contraseña</ion-label>
              <ion-input
                [type]="showConfirmPassword() ? 'text' : 'password'"
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                required
                #confirmInput="ngModel"
                autocomplete="new-password"
              ></ion-input>
              <ion-button fill="clear" slot="end" (click)="toggleConfirmPassword()">
                <ion-icon [name]="showConfirmPassword() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
              </ion-button>
            </ion-item>
            <div *ngIf="confirmInput.touched && confirmPassword !== password" class="error-text text-level-4">
              Las contraseñas no coinciden
            </div>

            <ion-button
              expand="block"
              fill="solid"
              color="primary"
              type="submit"
              class="submit-btn"
              [disabled]="registerForm.invalid || confirmPassword !== password || isLoading()"
            >
              <ion-icon *ngIf="isLoading()" name="circular-outline" slot="start" class="spin"></ion-icon>
              <ion-icon *ngIf="!isLoading()" name="person-add-outline" slot="start"></ion-icon>
              {{ isLoading() ? 'Creando cuenta...' : 'Crear cuenta' }}
            </ion-button>
          </form>

          <!-- Enlace login -->
          <div class="login-link text-center ion-margin-top">
            <span class="text-level-4">¿Ya tienes cuenta? </span>
            <ion-button fill="clear" color="primary" size="small" (click)="goToLogin()">
              Ingresar
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
    .login-link {
      font-family: var(--font-family-body);
    }
  `],
})
export class RegisterPage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  nationalId = '';
  password = '';
  confirmPassword = '';
  profilePhoto = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = this.authFacade.isLoading;
  showError = signal(false);
  errorMessage = signal('');

  constructor() {
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, personAddOutline, arrowBackOutline, refreshCircleOutline });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  pickProfilePhoto(): void {
    console.log('Seleccionar foto de perfil');
  }

  async onRegister(): Promise<void> {
    try {
      await this.authFacade.register(this.nationalId, this.password, this.profilePhoto() ?? undefined);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Error al crear cuenta');
      this.showError.set(true);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }
}