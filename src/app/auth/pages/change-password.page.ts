import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonToast } from '@ionic/angular/ion-toast';
import { AppInputComponent, AppButtonPrimaryComponent } from '../../shared';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowBackOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../../shared/utils';

/**
 * Cambiar contraseña — Template de formulario (Design System §2.1).
 * Contraseña actual, nueva y confirmación. Al guardar confirma con un aviso breve y vuelve a Perfil.
 */
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonToast,
    AppInputComponent,
    AppButtonPrimaryComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goBack()" aria-label="Volver">
            <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="text-level-1">Cambiar contraseña</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form class="form-page" (ngSubmit)="onChangePassword()" #form="ngForm" novalidate>
        <p class="form-page__intro">
          Escribe tu contraseña actual y luego la nueva. La usarás la próxima vez que ingreses.
        </p>

        <div class="form-page__fields">
          <app-input
            label="Contraseña actual"
            type="password"
            name="currentPassword"
            [(ngModel)]="currentPassword"
            required
            minlength="6"
            maxlength="50"
            autocomplete="current-password"
            errorMessage="Escribe tu contraseña actual."
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
            helperText="Mínimo 6 caracteres."
            errorMessage="Usa al menos 6 caracteres."
          ></app-input>

          <app-input
            label="Confirmar nueva contraseña"
            type="password"
            name="confirmNewPassword"
            [(ngModel)]="confirmNewPassword"
            required
            autocomplete="new-password"
            [errorMessage]="passwordMismatch() ? 'Las contraseñas no coinciden.' : 'Repite la nueva contraseña.'"
          ></app-input>
        </div>

        @if (errorMessage()) {
          <p class="form-error" role="alert">
            <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
            <span>{{ errorMessage() }}</span>
          </p>
        }

        <app-button-primary
          type="submit"
          [loading]="isLoading()"
          [disabled]="form.invalid || passwordMismatch()"
          loadingText="Guardando..."
          iconStart="lock-closed-outline"
        >
          Guardar contraseña
        </app-button-primary>
      </form>

      <ion-toast
        [isOpen]="showSuccess()"
        message="Contraseña actualizada."
        duration="2000"
        position="bottom"
        color="success"
        (didDismiss)="showSuccess.set(false)"
      ></ion-toast>
    </ion-content>
  `,
})
export class ChangePasswordPage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmNewPassword = signal('');
  readonly isLoading = this.authFacade.isLoading;
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccess = signal(false);

  readonly passwordMismatch = computed(
    () => !!this.confirmNewPassword() && this.newPassword() !== this.confirmNewPassword(),
  );

  constructor() {
    addIcons({ alertCircleOutline, arrowBackOutline, lockClosedOutline });
  }

  async onChangePassword(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.authFacade.changePassword(this.currentPassword(), this.newPassword());
      this.showSuccess.set(true);
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmNewPassword.set('');
      setTimeout(() => this.goBack(), 2000);
    } catch (err: unknown) {
      this.errorMessage.set(apiErrorMessage(err, 'No se pudo cambiar la contraseña. Intenta de nuevo.'));
    }
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
