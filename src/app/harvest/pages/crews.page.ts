import { Component, effect, inject } from '@angular/core';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { addIcons } from 'ionicons';
import { peopleOutline, addOutline, chevronForwardOutline, alertCircleOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { apiErrorMessage } from '../../shared/utils';

/**
 * Pantalla Cuadrillas — Tarea 3.2.
 * Lista de cuadrillas de la cosecha activa + botón crear nueva.
 * Conecta con HarvestFacade para cargar datos reales.
 */
@Component({
  selector: 'app-crews',
  standalone: true,
  imports: [
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardContent, IonCardTitle, IonCardSubtitle],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">Cuadrillas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (harvestFacade.isLoading()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (!harvestFacade.hasActiveHarvest()) {
        <!-- Sin cosecha activa -->
        <ion-card class="empty-state-card">
          <ion-card-content class="text-center">
            <ion-icon name="alert-circle-outline" size="large" color="warning"></ion-icon>
            <h2 class="text-level-2 ion-margin-top">Sin cosecha activa</h2>
            <p class="text-level-4 ion-margin">Abre una cosecha para gestionar cuadrillas.</p>
            <ion-button fill="solid" color="primary" class="ion-margin-top" (click)="goToOpenHarvest()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Abrir cosecha
            </ion-button>
          </ion-card-content>
        </ion-card>
      } @else {
        <div class="header-actions">
          <h2 class="text-level-2">Cuadrillas de "{{ harvestFacade.activeHarvestName() }}"</h2>
          <!-- Con lista vacía la única acción es la del estado vacío, para no duplicar botones -->
          @if (harvestFacade.activeHarvestCrews().length > 0) {
            <ion-button fill="solid" color="primary" (click)="createCrew()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Nueva cuadrilla
            </ion-button>
          }
        </div>

        @if (harvestFacade.activeHarvestCrews().length === 0) {
          <!-- Estado vacío -->
          <ion-card class="empty-state-card">
            <ion-card-content class="text-center">
              <ion-icon name="people-outline" size="large" color="medium"></ion-icon>
              <h3 class="text-level-2 ion-margin-top">Sin cuadrillas</h3>
              <p class="text-level-4 ion-margin">Crea tu primera cuadrilla para agrupar recolectores.</p>
              <ion-button fill="solid" color="primary" class="ion-margin-top" (click)="createCrew()">
                <ion-icon name="add-outline" slot="start"></ion-icon>
                Crear cuadrilla
              </ion-button>
            </ion-card-content>
          </ion-card>
        } @else {
          <!-- Lista de cuadrillas -->
          @for (crew of harvestFacade.activeHarvestCrews(); track crew.id) {
            <ion-card class="crew-card" (click)="goToCrewDetail(crew.id)">
              <ion-card-content>
                <div class="crew-info">
                  <ion-card-title class="text-level-3">{{ crew.name }}</ion-card-title>
                  <ion-card-subtitle class="text-level-4">{{ getPickersCount(crew.id) }} recolectores</ion-card-subtitle>
                </div>
                <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
              </ion-card-content>
            </ion-card>
          }
        }
      }
    </ion-content>
  `,
  styles: [`
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    .empty-state-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      text-align: center;
      padding: var(--spacing-xl) var(--spacing-md);
    }
    .crew-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--card-gap-vertical);
      cursor: pointer;
    }
    .crew-card ion-card-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }
    .crew-info {
      flex: 1;
    }
    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }
    .text-center {
      text-align: center;
    }
  `],
})
export class CrewsPage {
  protected readonly harvestFacade = inject(HarvestFacade);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({ peopleOutline, addOutline, chevronForwardOutline, alertCircleOutline });

    // Cargar cuadrillas al inicializar
    effect(() => {
      if (this.harvestFacade.hasActiveHarvest()) {
        this.harvestFacade.loadCrews(this.harvestFacade.activeHarvest()!.id);
      }
    });
  }

  getPickersCount(crewId: string): number {
    // Filtrar pickers por crewId
    return this.harvestFacade.activeHarvestPickers().filter((p: { crewId: string | null }) => p.crewId === crewId).length;
  }

  /** Diálogo con un solo campo: la cuadrilla solo necesita un nombre (Design System §1.3). */
  async createCrew(): Promise<void> {
    const count = this.harvestFacade.activeHarvestCrews().length;
    const alert = await this.alertController.create({
      header: 'Nueva cuadrilla',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Ej: Cuadrilla de don José',
          value: `Cuadrilla ${count + 1}`,
          attributes: { maxlength: 100, autocapitalize: 'sentences' },
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: (data: { name: string }) => {
            const name = data.name?.trim();
            if (!name) return false; // mantiene el diálogo abierto
            this.saveCrew(name);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async saveCrew(name: string): Promise<void> {
    try {
      await this.harvestFacade.createCrew(name);
    } catch (err: unknown) {
      const toast = await this.toastController.create({
        message: apiErrorMessage(err, 'No se pudo crear la cuadrilla. Intenta de nuevo.'),
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    }
  }

  goToCrewDetail(crewId: string): void {
    this.router.navigate(['/harvest/crews', crewId]);
  }

  goToOpenHarvest(): void {
    this.router.navigate(['/harvest/open']);
  }
}