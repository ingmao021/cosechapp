import { Component, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonChip } from '@ionic/angular/ion-chip';
import { IonLabel } from '@ionic/angular/ion-label';
import { addIcons } from 'ionicons';
import { personOutline, addOutline, chevronForwardOutline, archiveOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { HarvestPickerCardComponent, AppChipComponent } from '@shared/components';

/**
 * Pantalla Detalle de Cuadrilla — Tarea 3.3.
 * Lista de recolectores asignados a la cuadrilla + botón agregar.
 * Conecta con HarvestFacade para cargar datos reales.
 */
@Component({
  selector: 'app-crew-detail',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonChip, IonLabel, HarvestPickerCardComponent, AppChipComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">{{ crewName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (harvestFacade.isLoading()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else {
        <div class="header-actions">
          <h2 class="text-level-2">Recolectores</h2>
          <ion-button fill="solid" color="primary" (click)="addPicker()">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Agregar recolector
          </ion-button>
        </div>

        @if (crewPickers().length === 0) {
          <!-- Estado vacío -->
          <ion-card class="empty-state-card">
            <ion-card-content class="text-center">
              <ion-icon name="person-outline" size="large" color="medium"></ion-icon>
              <h3 class="text-level-2 ion-margin-top">Sin recolectores</h3>
              <p class="text-level-4 ion-margin">Agrega recolectores del catálogo o crea nuevos.</p>
              <ion-button fill="solid" color="primary" class="ion-margin-top" (click)="addPicker()">
                <ion-icon name="add-outline" slot="start"></ion-icon>
                Agregar recolector
              </ion-button>
            </ion-card-content>
          </ion-card>
        } @else {
          <harvest-picker-card
            *ngFor="let picker of crewPickers()"
            [picker]="picker"
            (cardClick)="goToPickerDetail(picker.id)"
            (weighClick)="goToWeighing(picker.id)"
          ></harvest-picker-card>
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
    .text-center {
      text-align: center;
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
export class CrewDetailPage {
  protected readonly harvestFacade = inject(HarvestFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  crewId = computed(() => this.route.snapshot.paramMap.get('crewId'));
  crewName = 'Cuadrilla';

  // Pickers filtrados por crewId
  crewPickers = computed(() => {
    const id = this.crewId();
    if (!id) return [];
    return this.harvestFacade.activeHarvestPickers().filter(p => p.crewId === id);
  })

  constructor() {
    addIcons({ personOutline, addOutline, chevronForwardOutline, archiveOutline });

    // Cargar nombre de la cuadrilla al inicializar
    effect(() => {
      const id = this.crewId();
      if (id) {
        this.loadCrewName(id);
      }
    });
  }

  async loadCrewName(id: string): Promise<void> {
    // TODO: cargar nombre real desde facade/servicio
    this.crewName = 'Cuadrilla ' + id.substring(0, 8);
  }

  addPicker(): void {
    // TODO: modal agregar recolector (desde catálogo o nuevo)
    console.log('Agregar recolector a cuadrilla:', this.crewId());
  }

  goToPickerDetail(pickerId: string): void {
    this.router.navigate(['/harvest/pickers', pickerId]);
  }

  goToWeighing(pickerId: string): void {
    this.router.navigate(['/harvest/pickers', pickerId, 'weighing', 'new']);
  }
}