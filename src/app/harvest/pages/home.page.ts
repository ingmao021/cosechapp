import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonChip } from '@ionic/angular/ion-chip';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { addIcons } from 'ionicons';
import { scaleOutline, cloudDownloadOutline, syncOutline, addOutline, closeOutline, pricetagOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';

/**
 * Pantalla Inicio (Home) — Cosecha activa.
 * Tarea 2.2: Conecta con HarvestFacade para mostrar datos reales.
 * Contenido según Design System 1.2:
 * - Header organismo: nombre cosecha + precio/kilo + botón "Cerrar cosecha"
 * - Si no hay cosecha: invitación a abrir nueva
 * - Precio FNC actual con fecha (placeholder - se conectará en Tarea 6.1)
 * - Indicador sincronización (placeholder - se conectará en Tarea 8)
 * - Botón "Pesar" → /harvest/crews
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    CurrencyPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">CosechApp</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (harvestFacade.hasActiveHarvest()) {
        <!-- Cosecha activa -->
        <ion-card class="harvest-header-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">{{ harvestFacade.activeHarvestName() }}</ion-card-title>
            <ion-card-subtitle class="text-level-4">
              {{ harvestFacade.activeHarvestPrice() | currency }}
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div class="header-actions">
              <ion-chip color="medium" class="sync-chip">
                <ion-icon name="sync-outline" slot="start"></ion-icon>
                <ion-label>Sincronizado</ion-label>
              </ion-chip>
              <ion-chip color="medium" class="fnc-chip">
                <ion-icon name="pricetag-outline" slot="start"></ion-icon>
                <ion-label>FNC: \$ 2.450 (26 sep)</ion-label>
              </ion-chip>
            </div>
            <div class="main-actions">
              <ion-button expand="block" fill="solid" color="primary" class="weigh-btn" (click)="goToWeigh()">
                <ion-icon name="scale-outline" slot="start"></ion-icon>
                Pesar
              </ion-button>
              <ion-button expand="block" fill="outline" color="danger" class="close-harvest-btn" (click)="goToCloseHarvest()">
                <ion-icon name="close-outline" slot="start"></ion-icon>
                Cerrar cosecha
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      } @else {
        <!-- Estado vacío: no hay cosecha activa -->
        <ion-card class="empty-state-card">
          <ion-card-content class="text-center">
            <ion-icon name="add-circle-outline" size="large" color="primary"></ion-icon>
            <h2 class="text-level-2 ion-margin-top">No hay cosecha activa</h2>
            <p class="text-level-4 ion-margin">Abre una nueva cosecha para empezar a registrar pesadas.</p>
            <ion-button fill="solid" color="primary" class="ion-margin-top" (click)="openHarvest()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Abrir nueva cosecha
            </ion-button>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .harvest-header-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
    }
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .sync-chip, .fnc-chip {
      --height: var(--chip-height);
      --border-radius: var(--chip-radius);
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
    }
    .main-actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    .weigh-btn {
      --border-radius: var(--radius-full);
      height: 56px;
      min-height: 56px;
      font-family: var(--font-family-display);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
    }
    .close-harvest-btn {
      --border-radius: var(--radius-full);
      height: 48px;
      min-height: 48px;
    }
    .empty-state-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      text-align: center;
    }
    .text-center {
      text-align: center;
    }
  `],
})
export class HomePage {
  protected readonly harvestFacade = inject(HarvestFacade);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ scaleOutline, cloudDownloadOutline, syncOutline, addOutline, closeOutline, pricetagOutline });

    // Cargar cosecha activa al inicializar
    effect(() => {
      this.harvestFacade.loadActiveHarvest();
    });
  }

  goToWeigh(): void {
    // Navegar a cuadrillas para pesar
    this.router.navigate(['/harvest/crews']);
  }

  goToCloseHarvest(): void {
    // Navegar a pantalla de cierre de cosecha (venta + costos)
    this.router.navigate(['/harvest/close']);
  }

  openHarvest(): void {
    // Navegar a página para abrir nueva cosecha
    this.router.navigate(['/harvest/open']);
  }
}