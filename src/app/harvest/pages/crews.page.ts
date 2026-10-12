import { Component, computed, effect, inject } from '@angular/core';
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
import { peopleOutline, addOutline, chevronForwardOutline, alertCircleOutline, personAddOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { apiErrorMessage } from '../../shared/utils';
import { HarvestPickerCardComponent, PickerCardData } from '@shared/components';
import { PickerActionsService } from '../services/picker-actions.service';
import { NetworkService } from '../../network/services/network.service';

/**
 * Pantalla Cuadrillas — Tarea 3.2 (se llega con "Pesar").
 * Cuadrillas de la cosecha activa + botón crear nueva, y abajo las personas que cosechan
 * solas ("Sin cuadrilla"), con Pesar, menú ⋮ y botón para agregar otra.
 */
@Component({
  selector: 'app-crews',
  standalone: true,
  imports: [
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardContent, IonCardTitle, IonCardSubtitle,
    HarvestPickerCardComponent],
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
      @if (harvestFacade.isLoading() && !harvestFacade.hasActiveHarvest()) {
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
              <p class="text-level-4 ion-margin">Crea una cuadrilla para agrupar recolectores. Si alguien cosecha solo, agrégalo abajo, en "Sin cuadrilla".</p>
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

        <!-- Personas que cosechan solas, sin cuadrilla -->
        <section class="solo-section" aria-labelledby="solo-title">
          <h2 id="solo-title" class="text-level-2">Sin cuadrilla @if (soloPickers().length > 0) { ({{ soloPickers().length }}) }</h2>
          <p class="text-level-4 solo-hint">Personas que vienen a cosechar solas, sin cuadrilla.</p>
          @for (picker of soloPickers(); track picker.id) {
            <app-harvest-picker-card
              [picker]="picker"
              [showMenu]="network.isOnline()"
              (cardClick)="goToPickerDetail($event)"
              (weighClick)="goToWeighing($event)"
              (menuClick)="openPickerMenu($event)"
            ></app-harvest-picker-card>
          }
          <ion-button expand="block" fill="outline" color="primary" [disabled]="!network.isOnline()" (click)="addSoloPicker()">
            <ion-icon name="person-add-outline" slot="start"></ion-icon>
            Agregar persona
          </ion-button>
          @if (!network.isOnline()) {
            <p class="text-level-4 solo-hint">Necesitas conexión para agregar personas.</p>
          }
        </section>
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
    .solo-section {
      margin-top: var(--spacing-xl);
    }
    .solo-section h2 {
      margin: 0 0 var(--spacing-xs);
    }
    .solo-hint {
      margin: 0 0 var(--spacing-md);
      color: var(--color-text-muted);
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
  private readonly pickerActions = inject(PickerActionsService);
  protected readonly network = inject(NetworkService);

  /** Recolectores activos sin cuadrilla (cosechan solos). */
  readonly soloPickers = computed(() =>
    this.harvestFacade.activeHarvestPickers().filter((picker) => picker.crewId === null && picker.status === 'active'),
  );

  constructor() {
    addIcons({ peopleOutline, addOutline, chevronForwardOutline, alertCircleOutline, personAddOutline });

    // Entrada directa (ej. al reabrir la app aquí): cargar la cosecha activa.
    if (!this.harvestFacade.hasActiveHarvest()) {
      this.harvestFacade.loadActiveHarvest();
    }
    // Cargar cuadrillas y recolectores al tener la cosecha
    effect(() => {
      const harvest = this.harvestFacade.activeHarvest();
      if (harvest) {
        this.harvestFacade.loadCrews(harvest.id);
        this.harvestFacade.loadPickers(harvest.id);
      }
    });
  }

  addSoloPicker(): void {
    this.router.navigate(['/harvest/pickers/add']);
  }

  openPickerMenu(card: PickerCardData): void {
    const picker = this.harvestFacade.pickerById(card.id);
    if (picker) void this.pickerActions.openMenu(picker);
  }

  goToPickerDetail(picker: PickerCardData): void {
    this.router.navigate(['/harvest/pickers', picker.id]);
  }

  goToWeighing(picker: PickerCardData): void {
    this.router.navigate(['/harvest/pickers', picker.id, 'weighing', 'new']);
  }

  getPickersCount(crewId: string): number {
    // Filtrar pickers por crewId
    return this.harvestFacade.activeHarvestPickers().filter((p: { crewId: string | null }) => p.crewId === crewId).length;
  }

  /** Diálogo con un solo campo: la cuadrilla solo necesita un nombre (Design System §1.3). */
  async createCrew(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nueva cuadrilla',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Ej: Cuadrilla de don José',
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