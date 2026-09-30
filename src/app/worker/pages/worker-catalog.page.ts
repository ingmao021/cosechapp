import { Component, effect, inject, signal } from '@angular/core';
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
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonAvatar } from '@ionic/angular/ion-avatar';
import { IonItemOption } from '@ionic/angular/ion-item-option';
import { IonItemOptions } from '@ionic/angular/ion-item-options';
import { IonItemSliding } from '@ionic/angular/ion-item-sliding';
import { IonList } from '@ionic/angular/ion-list';
import { IonToast } from '@ionic/angular/ion-toast';
import { addIcons } from 'ionicons';
import { personAddOutline, personOutline, callOutline, createOutline, trashOutline, chevronForwardOutline } from 'ionicons/icons';
import { WorkerFacade } from '../services/worker.facade';

/**
 * Pantalla Catálogo de Trabajadores — Tarea 3.1.
 * Lista global de trabajadores con opción a crear/editar/eliminar.
 * Acceso desde Perfil.
 */
@Component({
  selector: 'app-worker-catalog',
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
    IonItem,
    IonLabel,
    IonAvatar,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonList,
    IonToast,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">Catálogo de trabajadores</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="solid" color="primary" (click)="goToCreate()">
            <ion-icon name="person-add-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (workerFacade.isLoading()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (workerFacade.workers().length === 0) {
        <!-- Estado vacío -->
        <ion-card class="empty-state-card">
          <ion-card-content class="text-center">
            <ion-icon name="people-outline" size="large" color="medium"></ion-icon>
            <h2 class="text-level-2 ion-margin-top">Sin trabajadores</h2>
            <p class="text-level-4 ion-margin">Agrega tu primer trabajador al catálogo.</p>
            <ion-button fill="solid" color="primary" class="ion-margin-top" (click)="goToCreate()">
              <ion-icon name="person-add-outline" slot="start"></ion-icon>
              Agregar trabajador
            </ion-button>
          </ion-card-content>
        </ion-card>
      } @else {
        <!-- Lista de trabajadores -->
        <ion-list lines="full">
          @for (worker of workerFacade.workers(); track worker.id) {
            <ion-item-sliding>
              <ion-item (click)="goToEdit(worker.id)" lines="full">
                <ion-avatar slot="start">
                  <ion-icon name="person-outline"></ion-icon>
                </ion-avatar>
                <ion-label>
                  <h3 class="text-level-3">{{ worker.displayName }}</h3>
                  <p class="text-level-4">
                    {{ worker.firstName }} {{ worker.lastName }}
                    @if (worker.alias) {
                      <span> • {{ worker.alias }}</span>
                    }
                  </p>
                  @if (worker.phoneNumber) {
                    <p class="text-level-4">
                      <ion-icon name="call-outline" size="small"></ion-icon>
                      {{ worker.phoneNumber }}
                    </p>
                  }
                </ion-label>
                <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
              </ion-item>

              <ion-item-options side="end">
                <ion-item-option color="danger" (click)="confirmDelete(worker)">
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-item-option>
                <ion-item-option color="primary" (click)="goToEdit(worker.id)">
                  <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </ion-list>
      }

      <!-- Toast error -->
      <ion-toast
        [isOpen]="showError()"
        [message]="errorMessage()"
        duration="3000"
        position="bottom"
        color="danger"
        (didDismiss)="showError.set(false)"
      ></ion-toast>

      <!-- Toast confirmar eliminación -->
      <ion-toast
        [isOpen]="showDeleteConfirm()"
        [message]="'¿Eliminar a ' + workerToDelete()?.displayName + '?'"
        position="bottom"
        color="warning"
        [buttons]="[
          { text: 'Cancelar', role: 'cancel', handler: () => cancelDelete() },
          { text: 'Eliminar', role: 'destructive', handler: () => executeDelete() }
        ]"
        (didDismiss)="onDeleteConfirmDismiss()"
      ></ion-toast>
    </ion-content>
  `,
  styles: [`
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
    ion-avatar {
      --background: var(--color-primary);
      --color: var(--color-text-on-primary);
    }
    ion-item {
      --background: var(--color-surface);
      --color: var(--color-text);
    }
    ion-item-option {
      --width: 60dp;
    }
  `],
})
export class WorkerCatalogPage {
  protected readonly workerFacade = inject(WorkerFacade);
  private readonly router = inject(Router);

  showError = signal(false);
  errorMessage = signal('');

  showDeleteConfirm = signal(false);
  workerToDelete = signal<any | null>(null);

  constructor() {
    addIcons({ personAddOutline, personOutline, callOutline, createOutline, trashOutline, chevronForwardOutline });

    // Cargar trabajadores al inicializar
    effect(() => {
      this.workerFacade.loadWorkers();
    });
  }

  goToCreate(): void {
    this.router.navigate(['/worker/create']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/worker/edit', id]);
  }

  confirmDelete(worker: any): void {
    this.workerToDelete.set(worker);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.workerToDelete.set(null);
    this.showDeleteConfirm.set(false);
  }

  async executeDelete(): Promise<void> {
    const worker = this.workerToDelete();
    if (!worker) return;

    try {
      await this.workerFacade.deleteWorker(worker.id);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? 'Error al eliminar trabajador');
      this.showError.set(true);
    } finally {
      this.cancelDelete();
    }
  }

  onDeleteConfirmDismiss(): void {
    this.cancelDelete();
  }
}