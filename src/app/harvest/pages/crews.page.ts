import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import { peopleOutline, addOutline, chevronForwardOutline, alertCircleOutline, personAddOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { apiErrorMessage, initialsOf } from '../../shared/utils';
import {
  EmptyStateComponent,
  HarvestPickerCardComponent,
  ListSkeletonComponent,
  NavRowComponent,
  PickerCardData,
} from '@shared/components';
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
    IonButtons,
    IonBackButton,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
    HarvestPickerCardComponent,
    EmptyStateComponent,
    ListSkeletonComponent,
    NavRowComponent,
  ],
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
        <app-list-skeleton [rows]="3"></app-list-skeleton>
      } @else if (!harvestFacade.hasActiveHarvest()) {
        <app-empty-state icon="alert-circle-outline" title="Sin cosecha activa">
          <p>Abre una cosecha para gestionar cuadrillas.</p>
          <ion-button fill="solid" color="primary" (click)="goToOpenHarvest()">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Abrir cosecha
          </ion-button>
        </app-empty-state>
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
          <app-empty-state icon="people-outline" title="Sin cuadrillas">
            <p>Crea una cuadrilla para agrupar recolectores. Si alguien cosecha solo, agrégalo abajo, en "Sin cuadrilla".</p>
            <ion-button fill="solid" color="primary" (click)="createCrew()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Crear cuadrilla
            </ion-button>
          </app-empty-state>
        } @else {
          <!-- Lista de cuadrillas -->
          <div class="crew-list stagger-in">
            @for (crew of harvestFacade.activeHarvestCrews(); track crew.id) {
              <!-- Iniciales, como en la tarjeta del recolector: la cuadrilla se reconoce por su
                   nombre, no por un ícono genérico repetido. -->
              <button
                app-nav-row
                [initials]="initials(crew.name)"
                [label]="crew.name"
                [subtitle]="getPickersCount(crew.id) + ' ' + (getPickersCount(crew.id) === 1 ? 'recolector' : 'recolectores')"
                (click)="goToCrewDetail(crew.id)"
              ></button>
            }
          </div>
        }

        <!-- Personas que cosechan solas, sin cuadrilla -->
        <section class="solo-section" aria-labelledby="solo-title">
          <h2 id="solo-title" class="text-level-2">Sin cuadrilla @if (soloPickers().length > 0) { ({{ soloPickers().length }}) }</h2>
          <p class="text-level-4 solo-hint">Personas que vienen a cosechar solas, sin cuadrilla.</p>
          <div class="stagger-in">
            @for (picker of soloPickers(); track picker.id) {
              <app-harvest-picker-card
                [picker]="picker"
                [showMenu]="network.isOnline()"
                (cardClick)="goToPickerDetail($event)"
                (weighClick)="goToWeighing($event)"
                (menuClick)="openPickerMenu($event)"
              ></app-harvest-picker-card>
            }
          </div>
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
    .header-actions h2 {
      margin: 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .crew-list {
      display: flex;
      flex-direction: column;
      gap: var(--card-gap-vertical);
    }
    .solo-section {
      margin-top: var(--spacing-xl);
    }
    .solo-section h2 {
      margin: 0 0 2px;
    }
    .solo-hint {
      margin: 0 0 var(--spacing-md);
      color: var(--color-text-muted);
    }
    .solo-section ion-button {
      margin-top: var(--spacing-sm);
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

  /** Iniciales de las dos primeras palabras del nombre de la cuadrilla. */
  readonly initials = initialsOf;

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