import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { AppInputComponent, AppButtonPrimaryComponent } from '@shared/components';
import { addIcons } from 'ionicons';
import { addOutline, alertCircleOutline, arrowBackOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../../shared/utils';

/**
 * Abrir cosecha — Template de formulario (Design System §2.1): nombre libre y precio por kilo.
 */
@Component({
  selector: 'app-open-harvest',
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
        <ion-title class="text-level-1">Abrir cosecha</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form class="form-page" (ngSubmit)="onOpenHarvest()" #form="ngForm" novalidate>
        <p class="form-page__intro">
          Dale un nombre a la cosecha y define cuánto pagas por kilo recogido.
        </p>

        <div class="form-page__fields">
          <app-input
            label="Nombre de la cosecha"
            name="name"
            [(ngModel)]="name"
            required
            maxlength="100"
            placeholder="Ej: Primer pasón, Mitaca 2026"
            errorMessage="Escribe un nombre para la cosecha."
          ></app-input>

          <app-input
            label="Precio por kilo (COP)"
            type="number"
            name="pricePerKilogram"
            [(ngModel)]="pricePerKilogram"
            required
            inputmode="numeric"
            placeholder="Ej: 1200"
            helperText="Lo que pagas al recolector por cada kilo de café cereza."
            errorMessage="Escribe el precio por kilo."
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
          [disabled]="form.invalid"
          loadingText="Abriendo..."
          iconStart="add-outline"
        >
          Abrir cosecha
        </app-button-primary>
      </form>
    </ion-content>
  `,
})
export class OpenHarvestPage {
  private readonly harvestFacade = inject(HarvestFacade);
  private readonly router = inject(Router);

  readonly name = signal('');
  readonly pricePerKilogram = signal<number | null>(null);
  readonly isLoading = this.harvestFacade.isLoading;
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ addOutline, alertCircleOutline, arrowBackOutline });
  }

  async onOpenHarvest(): Promise<void> {
    this.errorMessage.set(null);
    const pricePerKilogram = this.pricePerKilogram();
    if (pricePerKilogram === null || pricePerKilogram <= 0) {
      this.errorMessage.set('El precio por kilo debe ser mayor que 0.');
      return;
    }

    try {
      await this.harvestFacade.openHarvest(this.name().trim(), pricePerKilogram);
    } catch (err: unknown) {
      this.errorMessage.set(apiErrorMessage(err, 'No se pudo abrir la cosecha. Intenta de nuevo.'));
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
