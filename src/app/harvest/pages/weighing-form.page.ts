import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { SharedModule } from '../../../shared/shared.module';
import { addIcons } from 'ionicons';
import { arrowBackOutline, scaleOutline } from 'ionicons/icons';

/**
 * Pantalla Registro de Pesada — Placeholder para Tarea 4.1.
 * Campo kilos + fecha/hora automática.
 */
@Component({
  selector: 'app-weighing-form',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonToast, SharedModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="text-level-1">Registrar pesada</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="auth-card">
        <ion-card-header class="text-center">
          <ion-card-title class="text-level-1">{{ pickerName }}</ion-card-title>
          <ion-card-subtitle class="text-level-4">Nueva pesada</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <div class="info-chips">
            <ion-chip color="primary">
              <ion-icon name="scale-outline" slot="start"></ion-icon>
              <ion-label>Acumulado hoy: {{ dailyKilos | kilos }}</ion-label>
            </ion-chip>
            <ion-chip color="medium">
              <ion-icon name="time-outline" slot="start"></ion-icon>
              <ion-label>{{ currentDate | dateFormat:'short' }}</ion-label>
            </ion-chip>
          </div>

          <form (ngSubmit)="onSave()" #form="ngForm">
            <app-input
              label="Kilos"
              type="number"
              name="kilograms"
              [(ngModel)]="kilograms"
              required
              min="0.1"
              step="0.1"
              inputmode="decimal"
              placeholder="Ej: 25.5"
              (valueChange)="kilograms = $event"
            ></app-input>

            <app-button-primary
              type="submit"
              [loading]="isLoading()"
              [disabled]="form.invalid"
              loadingText="Guardando..."
              iconStart="scale-outline"
            >
              Guardar pesada
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
        [message]="'Pesada guardada correctamente'"
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
    .info-chips {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
  `],
})
export class WeighingFormPage {
  private readonly router = inject(Router);

  pickerName = 'Juan Pérez';
  dailyKilos = 45.5;
  currentDate = new Date();
  kilograms = 0;
  isLoading = signal(false);
  showError = signal(false);
  errorMessage = signal('');
  showSuccess = signal(false);

  constructor() {
    addIcons({ arrowBackOutline, scaleOutline });
  }

  async onSave(): Promise<void> {
    if (this.kilograms <= 0) {
      this.errorMessage.set('Los kilos deben ser mayores a 0');
      this.showError.set(true);
      return;
    }

    this.isLoading.set(true);
    try {
      // TODO: llamar WeighingFacade.recordWeighing() en Tarea 4.1
      await new Promise(r => setTimeout(r, 500));
      this.showSuccess.set(true);
      setTimeout(() => this.goBack(), 2000);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Error al guardar pesada');
      this.showError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/harvest/crews']);
  }
}