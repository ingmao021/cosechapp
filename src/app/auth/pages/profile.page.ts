import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { person, keyOutline, documentTextOutline, logOutOutline, peopleOutline, chevronForwardOutline } from 'ionicons/icons';
import { NavRowComponent } from '@shared/components';
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
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, NavRowComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page">
        <!-- Identidad: avatar centrado sobre un halo verde suave, como la ficha de un
             contacto del sistema. Es lo primero que se ve y no compite con nada. -->
        <header class="identity">
          <div class="identity__avatar">
            @if (profilePhoto()) {
              <img [src]="profilePhoto()" alt="Foto de perfil" />
            } @else {
              <ion-icon name="person" aria-hidden="true"></ion-icon>
            }
          </div>
          <h2 class="identity__id num">C.C. {{ userNationalId() }}</h2>
          <p class="identity__role">Caficultor</p>
        </header>

        <!-- Ajustes como tiles separados: cada uno es un destino, no un dato. -->
        <nav class="settings" aria-label="Opciones de la cuenta">
          <button app-nav-row icon="people-outline" label="Catálogo de trabajadores" (click)="goToWorkerCatalog()"></button>
          <button app-nav-row icon="key-outline" label="Cambiar contraseña" (click)="changePassword()"></button>
          <button app-nav-row icon="document-text-outline" label="Aviso de privacidad" (click)="goToPrivacy()"></button>
        </nav>

        <button type="button" class="logout tappable" (click)="logout()">
          <ion-icon name="log-out-outline" aria-hidden="true"></ion-icon>
          Cerrar sesión
        </button>

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
      </div>
    </ion-content>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      max-width: 480px;
      margin: 0 auto;
      padding: 0 var(--screen-margin) var(--spacing-xl);
    }
    .identity {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-md) 0 0;
      text-align: center;
      /* Halo: un claro café detrás del avatar, sin franja de color que corte la pantalla. */
      background: radial-gradient(closest-side, var(--color-secondary-chip-pressed), transparent) center 0 / 260px 200px no-repeat;
    }
    .identity__avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 96px;
      height: 96px;
      margin-bottom: var(--spacing-md);
      border: 4px solid var(--color-surface);
      border-radius: 50%;
      background: var(--color-secondary-chip);
      box-shadow: var(--shadow-card);
      color: var(--color-secondary);
      overflow: hidden;
    }
    .identity__avatar ion-icon {
      font-size: 44px;
    }
    .identity__avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .identity__id {
      margin: 0;
      font-family: var(--font-family-body);
      font-size: var(--font-size-title);
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.01em;
      color: var(--color-text);
      overflow-wrap: anywhere;
    }
    .identity__role {
      margin: 2px 0 0;
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .settings {
      display: flex;
      flex-direction: column;
      gap: var(--card-gap-vertical);
    }
    /* Cerrar sesión: píldora de ancho completo con tinte rojo tierra suave. Es una
       salida, no la acción principal: no lleva relleno sólido. */
    .logout {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      width: 100%;
      min-height: var(--btn-primary-height);
      border: 0;
      border-radius: var(--radius-full);
      background: rgba(122, 46, 34, 0.08);
      color: var(--color-accent-alert);
      font-family: var(--font-family-body);
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
    }
    .logout ion-icon {
      font-size: 20px;
    }
    .logout:active {
      background: rgba(122, 46, 34, 0.14);
      box-shadow: none;
    }
    .legal {
      padding: 0 var(--spacing-xs);
      font-family: var(--font-family-body);
    }
    .legal h3 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-footnote);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }
    .legal p {
      margin: 0;
      max-width: 60ch;
      font-size: var(--font-size-footnote);
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
    addIcons({ person, keyOutline, documentTextOutline, logOutOutline, peopleOutline, chevronForwardOutline });
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