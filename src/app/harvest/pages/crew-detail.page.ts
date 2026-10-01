import { Component, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { addIcons } from 'ionicons';
import { personAddOutline, peopleOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { HarvestPickerCardComponent, PickerCardData, SyncStatusComponent } from '@shared/components';
import { NetworkService } from '../../network/services/network.service';

/**
 * Detalle de cuadrilla (Design System §1.4): recolectores de la cuadrilla con sus kilos
 * de hoy, acceso a pesar y botón para agregar recolectores (requiere conexión).
 */
@Component({
  selector: 'app-crew-detail',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    HarvestPickerCardComponent,
    SyncStatusComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/harvest/crews" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">{{ crewName() }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <app-sync-status></app-sync-status>

      @if (harvestFacade.isLoading() && crewPickers().length === 0) {
        <div class="loading-center"><ion-spinner name="crescent"></ion-spinner></div>
      } @else if (crewPickers().length === 0) {
        <div class="empty-state">
          <ion-icon name="people-outline" aria-hidden="true"></ion-icon>
          <h2 class="text-level-2">Sin recolectores</h2>
          <p class="text-level-4">Agrega recolectores del catálogo o crea uno nuevo.</p>
          <ion-button color="primary" [disabled]="!network.isOnline()" (click)="addPicker()">
            <ion-icon name="person-add-outline" slot="start"></ion-icon>
            Agregar recolector
          </ion-button>
          @if (!network.isOnline()) {
            <p class="text-level-4">Necesitas conexión para agregar recolectores.</p>
          }
        </div>
      } @else {
        <div class="list-header">
          <h2 class="text-level-2">Recolectores ({{ crewPickers().length }})</h2>
          <ion-button fill="outline" color="primary" size="small" [disabled]="!network.isOnline()" (click)="addPicker()">
            <ion-icon name="person-add-outline" slot="start"></ion-icon>
            Agregar
          </ion-button>
        </div>
        @for (picker of crewPickers(); track picker.id) {
          <app-harvest-picker-card
            [picker]="picker"
            (cardClick)="goToPickerDetail($event)"
            (weighClick)="goToWeighing($event)"
          ></app-harvest-picker-card>
        }
      }
    </ion-content>
  `,
  styles: [`
    app-sync-status {
      margin-bottom: var(--spacing-md);
    }
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .list-header h2 {
      margin: 0;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xl) var(--spacing-md);
      text-align: center;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
    }
    .empty-state ion-icon[aria-hidden] {
      font-size: 40px;
      color: var(--color-text-muted);
    }
    .empty-state h2,
    .empty-state p {
      margin: 0;
    }
    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }
  `],
})
export class CrewDetailPage {
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly network = inject(NetworkService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly crewId = this.route.snapshot.paramMap.get('crewId') ?? '';

  readonly crewName = computed(() => this.harvestFacade.crewById(this.crewId)?.name ?? 'Cuadrilla');

  /** Recolectores activos de esta cuadrilla. */
  readonly crewPickers = computed(() =>
    this.harvestFacade
      .activeHarvestPickers()
      .filter((picker) => picker.crewId === this.crewId && picker.status === 'active'),
  );

  constructor() {
    addIcons({ personAddOutline, peopleOutline });
    // Entrada directa (ej. al reabrir la app aquí): cargar la cosecha activa.
    if (!this.harvestFacade.hasActiveHarvest()) {
      this.harvestFacade.loadActiveHarvest();
    }
  }

  addPicker(): void {
    this.router.navigate(['/harvest/crews', this.crewId, 'add-picker']);
  }

  goToPickerDetail(picker: PickerCardData): void {
    this.router.navigate(['/harvest/pickers', picker.id]);
  }

  goToWeighing(picker: PickerCardData): void {
    this.router.navigate(['/harvest/pickers', picker.id, 'weighing', 'new']);
  }
}
