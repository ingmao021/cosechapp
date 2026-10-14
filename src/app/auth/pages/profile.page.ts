import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonAvatar } from '@ionic/angular/ion-avatar';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { addIcons } from 'ionicons';
import { personOutline, keyOutline, documentOutline, logOutOutline, peopleOutline, chevronForwardOutline } from 'ionicons/icons';
import { AuthFacade } from '../services/auth.facade';
import { SyncFacade } from '../../sync/services/sync.facade';
import { AlertController } from '@ionic/angular/alert-controller';
import { Router } from '@angular/router';

/**
 * Pestaña Perfil — Placeholder para Tarea 1.3.
 * Contenido según Design System 1.12:
 * - Foto de perfil, cédula (no editable), cambiar contraseña
 * - Acceso a catálogo de trabajadores
 * - Cerrar sesión
 * - Aviso de privacidad / política de tratamiento de datos (habeas data)
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonAvatar, IonCard, IonCardContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Perfil de usuario -->
      <ion-card class="profile-card">
        <ion-card-content>
          <div class="profile-header">
            <ion-avatar class="profile-avatar">
              @if (!profilePhoto()) {
                <ion-icon name="person-outline" size="large"></ion-icon>
              }
              @if (profilePhoto()) {
                <img [src]="profilePhoto()" alt="Foto de perfil" />
              }
            </ion-avatar>
            <div class="profile-info">
              <p class="text-level-4 profile-label">Cédula</p>
              <h2 class="text-level-2">{{ userNationalId() }}</h2>
              <p class="text-level-4 profile-label">Caficultor</p>
            </div>
          </div>

          <!-- Ajustes como filas: se leen como opciones de la app, no como tres botones iguales. -->
          <nav class="settings" aria-label="Opciones de la cuenta">
            <button type="button" class="settings__row" (click)="goToWorkerCatalog()">
              <span class="settings__icon" aria-hidden="true"><ion-icon name="people-outline"></ion-icon></span>
              <span class="settings__label">Catálogo de trabajadores</span>
              <ion-icon name="chevron-forward-outline" class="settings__chevron" aria-hidden="true"></ion-icon>
            </button>
            <button type="button" class="settings__row" (click)="changePassword()">
              <span class="settings__icon" aria-hidden="true"><ion-icon name="key-outline"></ion-icon></span>
              <span class="settings__label">Cambiar contraseña</span>
              <ion-icon name="chevron-forward-outline" class="settings__chevron" aria-hidden="true"></ion-icon>
            </button>
            <button type="button" class="settings__row" (click)="goToPrivacy()">
              <span class="settings__icon" aria-hidden="true"><ion-icon name="document-outline"></ion-icon></span>
              <span class="settings__label">Aviso de privacidad</span>
              <ion-icon name="chevron-forward-outline" class="settings__chevron" aria-hidden="true"></ion-icon>
            </button>
          </nav>

          <ion-button fill="outline" color="danger" expand="block" class="logout-btn" (click)="logout()">
            <ion-icon name="log-out-outline" slot="start"></ion-icon>
            Cerrar sesión
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Info legal: nota al pie, no otra tarjeta compitiendo con la de la cuenta. -->
      <section class="legal" aria-labelledby="legal-title">
        <h3 id="legal-title">Información legal</h3>
        <p>
          Esta app procesa datos personales bajo la Ley 1581 de 2012 (Habeas Data).
          Al usar la app, autorizas el tratamiento de tus datos y los de tus recolectores
          para la gestión de cosechas y pagos.
        </p>
        <ion-button fill="clear" color="primary" size="small" (click)="goToPrivacy()">
          Ver política completa
          <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
        </ion-button>
      </section>
    </ion-content>
  `,
  styles: [`
    .profile-card {
      --card-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    .profile-avatar {
      width: var(--avatar-size);
      height: var(--avatar-size);
      --border-radius: var(--avatar-radius);
      flex-shrink: 0;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .profile-avatar img {
      width: 100%;
      height: 100%;
      border-radius: var(--avatar-radius);
      object-fit: cover;
    }
    .profile-info {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .profile-info h2,
    .profile-label {
      margin: 0;
    }
    .settings {
      display: flex;
      flex-direction: column;
      margin: 0 calc(-1 * var(--spacing-sm)) var(--spacing-md);
    }
    .settings__row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      width: 100%;
      min-height: var(--list-row-height);
      padding: 0 var(--spacing-sm);
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text);
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      text-align: left;
      cursor: pointer;
      transition:
        transform var(--dur-press) var(--ease-out),
        background-color var(--dur-fast) ease;
    }
    .settings__row:active {
      background: var(--color-surface-muted);
    }
    /* Divisor alineado con el texto, no con el ícono, como en los ajustes nativos. */
    .settings__row + .settings__row {
      position: relative;
    }
    .settings__row + .settings__row::before {
      content: '';
      position: absolute;
      top: 0;
      left: calc(var(--spacing-sm) + 24px + var(--spacing-md));
      right: var(--spacing-sm);
      height: 1px;
      background: rgba(43, 36, 32, 0.08);
    }
    /* Ícono de lista de Android: solo el trazo, sin recuadro de color detrás. */
    .settings__icon {
      display: flex;
      flex-shrink: 0;
      width: 24px;
      color: var(--color-primary);
    }
    .settings__icon ion-icon {
      font-size: 24px;
    }
    .settings__label {
      flex: 1;
      min-width: 0;
      font-weight: var(--font-weight-bold);
    }
    .settings__chevron {
      font-size: 20px;
      color: var(--color-text-muted);
    }
    .logout-btn {
      --border-radius: var(--radius-full);
      height: 48px;
      min-height: 48px;
    }
    .legal {
      padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-xl);
      font-family: var(--font-family-body);
    }
    .legal h3 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }
    .legal p {
      margin: 0;
      max-width: 60ch;
      font-size: var(--font-size-sm);
      line-height: 1.5;
      color: var(--color-text-muted);
    }
    .legal ion-button {
      margin: var(--spacing-xs) 0 0 calc(-1 * var(--spacing-sm));
    }
  `],
})
export class ProfilePage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly syncFacade = inject(SyncFacade);
  private readonly alertController = inject(AlertController);

  readonly userNationalId = this.authFacade.userNationalId;
  readonly profilePhoto = this.authFacade.userProfilePhoto;

  constructor() {
    addIcons({ personOutline, keyOutline, documentOutline, logOutOutline, peopleOutline, chevronForwardOutline });
  }

  changePassword(): void {
    this.router.navigate(['/auth/change-password']);
  }

  goToWorkerCatalog(): void {
    this.router.navigate(['/worker/catalog']);
  }

  goToPrivacy(): void {
    this.router.navigate(['/auth/privacy']);
  }

  /** Al cerrar sesión se borran los datos del teléfono: si hay pesadas sin enviar, se perderían. */
  async logout(): Promise<void> {
    const pending = this.syncFacade.pendingCount();
    const alert = await this.alertController.create({
      header: '¿Cerrar sesión?',
      message:
        pending > 0
          ? `Tienes ${pending} ${pending === 1 ? 'pesada' : 'pesadas'} sin enviar. Si cierras sesión ahora se perderán. Conéctate a internet para enviarlas primero.`
          : 'Para volver a entrar necesitarás tu cédula y contraseña.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: pending > 0 ? 'Cerrar y perder pesadas' : 'Cerrar sesión', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') await this.authFacade.logout();
  }
}