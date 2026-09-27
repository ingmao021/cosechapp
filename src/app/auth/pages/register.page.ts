import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonToast } from '@ionic/angular/ion-toast';
import { AppInputComponent, AppButtonPrimaryComponent, AppAvatarComponent } from '../../shared';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';

/**
 * Pantalla Registro — Tarea 1.2.
 * Mismos campos que login + confirmación de contraseña.
 * Foto de perfil opcional.
 * Componentes atómicos shared: app-input, app-button-primary, app-avatar
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonToast,
    AppInputComponent,
    AppButtonPrimaryComponent,
    AppAvatarComponent,
  ],
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
            <app-avatar
              [src]="profilePhoto()"
              [fallbackIcon]="'person-add-outline'"
              [clickable]="true"
              (click)="pickProfilePhoto()"
            ></app-avatar>
            <p class="text-level-4 ion-margin-top">Foto opcional (tap para cambiar)</p>
          </div>

          <!-- Formulario -->
          <form (ngSubmit)="onRegister()" #registerForm="ngForm">
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
              (valueChange)="nationalId = $event"
            ></app-input>

            <app-input
              label="Contraseña"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              maxlength="50"
              autocomplete="new-password"
              (valueChange)="password = $event"
            ></app-input>

            <app-input
              label="Confirmar contraseña"
              type="password"
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              required
              autocomplete="new-password"
              [errorMessage]="passwordMismatch() ? 'Las contraseñas no coinciden' : ''"
              (valueChange)="confirmPassword = $event"
            ></app-input>

            <app-button-primary
              type="submit"
              [loading]="isLoading()"
              [disabled]="registerForm.invalid || passwordMismatch()"
              loadingText="Creando cuenta..."
              iconStart="person-add-outline"
            >
              Crear cuenta
            </app-button-primary>
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
    .login-link {
      font-family: var(--font-family-body);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
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
  isLoading = this.authFacade.isLoading;
  showError = signal(false);
  errorMessage = signal('');

  passwordMismatch = computed(() => this.confirmPassword && this.password !== this.confirmPassword);

  constructor() {
    addIcons({ arrowBackOutline });
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