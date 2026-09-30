import { Component, inject } from '@angular/core';
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
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { addIcons } from 'ionicons';
import { arrowBackOutline, documentTextOutline, shieldOutline, personOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';

/**
 * Pantalla Aviso de Privacidad — Tarea 1.3.
 * Política de tratamiento de datos según Ley 1581 de 2012 (Habeas Data).
 */
@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [
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
    IonItem,
    IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="text-level-1">Aviso de privacidad</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="policy-card">
        <ion-card-header>
          <ion-card-title class="text-level-2">Política de Tratamiento de Datos</ion-card-title>
          <ion-card-subtitle class="text-level-4">Ley 1581 de 2012 - Habeas Data</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <div class="policy-section">
            <h3 class="text-level-3">1. Responsable del tratamiento</h3>
            <p class="text-level-4">
              CosechApp (en adelante, "la App"), actuando como responsable del tratamiento de datos personales,
              garantiza el derecho fundamental de habeas data establecido en la Constitución Política de Colombia
              y desarrollado en la Ley 1581 de 2012 y sus decretos reglamentarios.
            </p>
          </div>

          <div class="policy-section">
            <h3 class="text-level-3">2. Finalidad del tratamiento</h3>
            <p class="text-level-4">
              Los datos personales recolectados (cédula, contraseña, foto de perfil opcional, datos de recolectores:
              nombres, apellidos, alias, teléfono, kilos recolectados, pagos realizados) se utilizan exclusivamente para:
            </p>
            <ul class="policy-list">
              <li class="text-level-4">Gestión de cosechas y ciclos de recolección</li>
              <li class="text-level-4">Registro y cálculo de pesadas por recolector</li>
              <li class="text-level-4">Cálculo y registro de pagos (incluyendo descuentos por alimentación)</li>
              <li class="text-level-4">Cálculo de ganancias brutas y netas por cosecha</li>
              <li class="text-level-4">Sincronización multi-dispositivo de la misma cuenta</li>
              <li class="text-level-4">Notificaciones de cambios en precio FNC</li>
            </ul>
          </div>

          <div class="policy-section">
            <h3 class="text-level-3">3. Datos de terceros (recolectores)</h3>
            <p class="text-level-4">
              Al registrar trabajadores en la App, el caficultor declara contar con autorización previa, expresa e
              informada de cada recolector para el tratamiento de sus datos personales (nombres, apellidos, alias,
              kilos recolectados, pagos), conforme al principio de finalidad y necesidad del habeas data.
            </p>
          </div>

          <div class="policy-section">
            <h3 class="text-level-3">4. Derechos del titular</h3>
            <p class="text-level-4">Como titular de los datos, usted tiene derecho a:</p>
            <ul class="policy-list">
              <li class="text-level-4">Conocer, actualizar y rectificar sus datos personales</li>
              <li class="text-level-4">Solicitar prueba de la autorización otorgada</li>
              <li class="text-level-4">Ser informado sobre el uso de sus datos</li>
              <li class="text-level-4">Presentar quejas ante la Superintendencia de Industria y Comercio</li>
              <li class="text-level-4">Revocar la autorización y/o solicitar supresión de datos</li>
              <li class="text-level-4">Acceder en forma gratuita a sus datos registrados</li>
            </ul>
          </div>

          <div class="policy-section">
            <h3 class="text-level-3">5. Seguridad y almacenamiento</h3>
            <p class="text-level-4">
              Los datos se almacenan cifrados en el dispositivo (AES-GCM con Android Keystore) y se transmiten
              bajo HTTPS al backend. La sincronización offline-first garantiza que los datos operativos
              (pesadas, pagos, costos) funcionen sin conexión y se sincronicen al recuperar señal.
            </p>
          </div>

          <div class="policy-section">
            <h3 class="text-level-3">6. Retención y eliminación</h3>
            <p class="text-level-4">
              Los datos se conservan mientras la cuenta esté activa. Al eliminar la cuenta, se procede a la
              supresión de datos personales en un plazo razonable, salvo obligación legal de conservación.
            </p>
          </div>

          <div class="policy-section">
            <h3 class="text-level-3">7. Contacto</h3>
            <p class="text-level-4">
              Para ejercer sus derechos o consultas sobre esta política, contacte al responsable a través de
              los canales oficiales de la App.
            </p>
          </div>

          <ion-item lines="none" class="accept-item">
            <ion-label class="text-level-4">
              He leído y acepto la política de tratamiento de datos.
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <ion-card class="legal-card">
        <ion-card-content>
          <h3 class="text-level-3 ion-margin-bottom">Derechos ARCO</h3>
          <p class="text-level-4 ion-margin-bottom">
            Acceso, Rectificación, Cancelación y Oposición. Puede ejercerlos en cualquier momento.
          </p>
          <ion-button fill="clear" color="primary" size="small" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
            Volver al perfil
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .policy-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
    }
    .policy-section {
      margin-bottom: var(--spacing-lg);
    }
    .policy-section h3 {
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
      margin-bottom: var(--spacing-xs);
    }
    .policy-section p {
      margin: 0 0 var(--spacing-sm) 0;
      line-height: 1.5;
    }
    .policy-list {
      margin: 0;
      padding-left: var(--spacing-lg);
    }
    .policy-list li {
      margin-bottom: var(--spacing-xs);
      line-height: 1.5;
    }
    .accept-item {
      --padding-start: 0;
      --padding-end: 0;
      margin-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
      padding-top: var(--spacing-md);
    }
    .legal-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      border: 1px solid var(--color-border);
    }
  `],
})
export class PrivacyPage {
  private readonly router = inject(Router);

  constructor() {
    addIcons({ arrowBackOutline, documentTextOutline, shieldOutline, personOutline, lockClosedOutline });
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}