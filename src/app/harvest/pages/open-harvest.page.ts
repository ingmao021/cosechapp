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
import { AppInputComponent } from '../../../shared/components/app-input.component';
import { AppButtonPrimaryComponent } from '../../../shared/components/app-button-primary.component';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { Router } from '@angular/router';

/**
 * Pantalla Abrir Nueva Cosecha — Tarea 2.3.
 * Formulario con nombre de cosecha y precio por kilo.
 */
@Component({
  selector: 'app-open-harvest',
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
        <ion-title class="text-level-1">Abrir cosecha</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="auth-card">
        <ion-card-header class="text-center">
          <ion-card-title class="text-level-1">Nueva cosecha</ion-card-title>
          <ion-card-subtitle class="text-level-4">Define nombre y precio por kilo</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <form (ngSubmit)="onOpenHarvest()" #form="ngForm">
            <app-input
              label="Nombre de la cosecha"
              type="text"
              name="name"
              [(ngModel)]="name"
              required
              maxlength="100"
              placeholder="Ej: Primer pasón, Mitaca 2026"
              (valueChange)="name = $event"
            ></app-input>

            <app-input
              label="Precio por kilo (COP)"
              type="number"
              name="pricePerKilogram"
              [(ngModel)]="pricePerKilogram"
              required
              min="1"
              inputmode="numeric"
              autocomplete="off"
              (valueChange)="pricePerKilogram = $event"
            ></app-input>

            <app-button-primary
              type="submit"
              [loading]="isLoading()"
              [disabled]="form.invalid"
              loadingText="Abriendo..."
              iconStart="add-outline"
            >
              Abrir cosecha
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
export class OpenHarvestPage {
  private readonly harvestFacade = inject(HarvestFacade);
  private readonly router = inject(Router);

  name = '';
  pricePerKilogram = 0;
  isLoading = this.harvestFacade.isLoading;
  showError = signal(false);
  errorMessage = signal('');

  constructor() {
    addIcons({ arrowBackOutline });
  }

  async onOpenHarvest(): Promise<void> {
    try {
      await this.harvestFacade.openHarvest(this.name, this.pricePerKilogram);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Error al abrir cosecha');
      this.showError.set(true);
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}