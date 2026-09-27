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
import { AppInputComponent, AppButtonPrimaryComponent } from '../../shared';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';

/**
 * Pantalla Cambiar Contraseña — Tarea 1.3.
 * Formulario con contraseña actual, nueva contraseña, confirmar nueva contraseña.
 */
@Component({
  selector: 'app-change-password',
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
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="text-level-1">Cambiar contraseña</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="auth-card">
        <ion-card-header class="text-center">
          <ion-card-title class="text-level-1">CosechApp</ion-card-title>
          <ion-card-subtitle class="text-level-4">Actualiza tu contraseña</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <form (ngSubmit)="onChangePassword()" #form="ngForm">
            <app-input
              label="Contraseña actual"
              type="password"
              name="currentPassword"
              [(ngModel)]="currentPassword"
              required
              minlength="6"
              maxlength="50"
              autocomplete="current-password"
              (valueChange)="currentPassword = $event"
            ></app-input>

            <app-input
              label="Nueva contraseña"
              type="password"
              name="newPassword"
              [(ngModel)]="newPassword"
              required
              minlength="6"
              maxlength="50"
              autocomplete="new-password"
              (valueChange)="newPassword = $event"
            ></app-input>

            <app-input
              label="Confirmar nueva contraseña"
              type="password"
              name="confirmNewPassword"
              [(ngModel)]="confirmNewPassword"
              required
              autocomplete="new-password"
              [errorMessage]="passwordMismatch() ? 'Las contraseñas no coinciden' : ''"
              (valueChange)="confirmNewPassword = $event"
            ></app-input>

            <app-button-primary
              type="submit"
              [loading]="isLoading()"
              [disabled]="form.invalid || passwordMismatch()"
              loadingText="Actualizando..."
              iconStart="lock-closed-outline"
            >
              Actualizar contraseña
            </app-button-primary>
          </form>
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

      <!-- Toast éxito -->
      <ion-toast
        [isOpen]="showSuccess()"
        [message]="'Contraseña actualizada correctamente'"
        duration="2000"
        position="bottom"
        color="success"
        (didDismiss)="showSuccess.set(false)"
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
    form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
  `],
})
export class ChangePasswordPage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  isLoading = this.authFacade.isLoading;
  showError = signal(false);
  errorMessage = signal('');
  showSuccess = signal(false);

  passwordMismatch = computed(() => this.confirmNewPassword && this.newPassword !== this.confirmNewPassword);

  constructor() {
    addIcons({ arrowBackOutline });
  }

  async onChangePassword(): Promise<void> {
    try {
      await this.authFacade.changePassword(this.currentPassword, this.newPassword);
      this.showSuccess.set(true);
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
      setTimeout(() => this.goBack(), 2000);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Error al actualizar contraseña');
      this.showError.set(true);
    }
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}