import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonAvatar } from '@ionic/angular/ion-avatar';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonChip } from '@ionic/angular/ion-chip';
import { addIcons } from 'ionicons';
import { personOutline, keyOutline, documentOutline, logOutOutline, peopleOutline, chevronForwardOutline } from 'ionicons/icons';
import { AuthFacade } from '../services/auth.facade';
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
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonAvatar, IonLabel, IonCard, IonCardContent, IonChip],
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
              <ion-icon name="person-outline" *ngIf="!profilePhoto()" size="large"></ion-icon>
              <img *ngIf="profilePhoto()" [src]="profilePhoto()" alt="Foto de perfil" />
            </ion-avatar>
            <div class="profile-info">
              <h2 class="text-level-2">{{ userNationalId() }}</h2>
              <ion-chip color="medium" class="role-chip">
                <ion-label>Caficultor</ion-label>
              </ion-chip>
            </div>
          </div>

          <div class="profile-actions">
            <ion-button fill="outline" color="primary" (click)="changePassword()">
              <ion-icon name="key-outline" slot="start"></ion-icon>
              Cambiar contraseña
            </ion-button>
            <ion-button fill="outline" color="primary" (click)="goToWorkerCatalog()">
              <ion-icon name="people-outline" slot="start"></ion-icon>
              Catálogo de trabajadores
            </ion-button>
            <ion-button fill="outline" color="primary" (click)="goToPrivacy()">
              <ion-icon name="document-outline" slot="start"></ion-icon>
              Aviso de privacidad
            </ion-button>
          </div>

          <ion-button fill="solid" color="danger" expand="block" class="logout-btn" (click)="logout()">
            <ion-icon name="log-out-outline" slot="start"></ion-icon>
            Cerrar sesión
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Info legal -->
      <ion-card class="legal-card">
        <ion-card-content>
          <h3 class="text-level-3 ion-margin-bottom">Información legal</h3>
          <p class="text-level-4">
            Esta app procesa datos personales bajo la Ley 1581 de 2012 (Habeas Data).
            Al usar la app, autorizas el tratamiento de tus datos y los de tus recolectores
            para la gestión de cosechas y pagos.
          </p>
          <ion-button fill="clear" color="primary" size="small" (click)="goToPrivacy()">
            <ion-icon name="open-outline" slot="end"></ion-icon>
            Ver política completa
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .profile-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
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
      background: var(--color-primary);
      color: var(--color-text-on-primary);
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
    }
    .role-chip {
      --height: var(--chip-height);
      --border-radius: var(--chip-radius);
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
    }
    .profile-actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .logout-btn {
      --border-radius: var(--radius-full);
      height: 48dp;
      min-height: 48dp;
    }
    .legal-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      border: 1px solid var(--color-border);
    }
  `],
})
export class ProfilePage {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

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

  async logout(): Promise<void> {
    await this.authFacade.logout();
  }
}