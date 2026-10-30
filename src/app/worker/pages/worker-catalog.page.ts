import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonItemOption } from '@ionic/angular/ion-item-option';
import { IonItemOptions } from '@ionic/angular/ion-item-options';
import { IonItemSliding } from '@ionic/angular/ion-item-sliding';
import { IonList } from '@ionic/angular/ion-list';
import { IonToast } from '@ionic/angular/ion-toast';
import { EmptyStateComponent, ListSkeletonComponent } from '@shared/components';
import { addIcons } from 'ionicons';
import { personAddOutline, personOutline, callOutline, createOutline, trashOutline, chevronForward, peopleOutline } from 'ionicons/icons';
import { WorkerFacade } from '../services/worker.facade';
import { apiErrorMessage, initialsOf } from '../../shared/utils';

/**
 * Pantalla Catálogo de Trabajadores — Tarea 3.1.
 * Lista global de trabajadores con opción a crear/editar/eliminar.
 * Acceso desde Perfil.
 */
@Component({
  selector: 'app-worker-catalog',
  standalone: true,
  imports: [
    EmptyStateComponent,
    ListSkeletonComponent,
    IonBackButton,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonList,
    IonToast,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/profile" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">Catálogo de trabajadores</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" color="primary" aria-label="Agregar trabajador" (click)="goToCreate()">
            <ion-icon name="person-add-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (workerFacade.isLoading() && workerFacade.workers().length === 0) {
        <app-list-skeleton [rows]="5"></app-list-skeleton>
      } @else if (workerFacade.workers().length === 0) {
        <app-empty-state icon="people-outline" title="Sin trabajadores">
          <p>Agrega tu primer trabajador al catálogo.</p>
          <ion-button fill="solid" color="primary" (click)="goToCreate()">
            <ion-icon name="person-add-outline" slot="start"></ion-icon>
            Agregar trabajador
          </ion-button>
        </app-empty-state>
      } @else {
        <!-- Lista de trabajadores -->
        <ion-list lines="inset" class="worker-list">
          @for (worker of workerFacade.workers(); track worker.id) {
            <ion-item-sliding>
              <ion-item button [detail]="false" (click)="goToEdit(worker.id)" lines="inset">
                <span slot="start" class="icon-chip worker-chip" aria-hidden="true">{{ initials(worker.firstName, worker.lastName) }}</span>
                <ion-label>
                  <h3>{{ worker.displayName }}</h3>
                  <!-- El nombre completo solo aporta cuando se muestra el alias arriba. -->
                  @if (worker.alias) {
                    <p class="text-level-4">{{ worker.firstName }} {{ worker.lastName }}</p>
                  }
                  @if (worker.phoneNumber) {
                    <p class="text-level-4">
                      <ion-icon name="call-outline" size="small" class="worker-phone-icon" aria-hidden="true"></ion-icon>
                      {{ worker.phoneNumber }}
                    </p>
                  }
                </ion-label>
                <ion-icon name="chevron-forward" slot="end" class="worker-chevron" aria-hidden="true"></ion-icon>
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
    /* La lista es una sola tarjeta: filas separadas por líneas finas, esquinas redondeadas. */
    .worker-list {
      padding: 0;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      overflow: hidden;
      background: var(--color-surface);
    }
    .worker-list h3 {
      margin: 0;
      overflow: hidden;
      font-family: var(--font-family-body);
      font-size: var(--font-size-headline);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .worker-list p {
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    /* Chip de iniciales con el mismo aire que una fila de navegación (12dp hasta el texto). */
    .worker-chip {
      margin-inline-end: var(--row-gap);
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
    }
    .worker-chevron {
      font-size: 18px;
      color: var(--color-text-muted);
    }
    .worker-phone-icon {
      color: var(--color-secondary);
    }
    ion-item {
      --background: var(--color-surface);
      --color: var(--color-text);
      --min-height: var(--row-min-height);
    }
    /* La tarjeta ya cierra la lista: la última fila no lleva línea debajo. */
    ion-item-sliding:last-child ion-item {
      --inner-border-width: 0;
    }
    ion-item-option {
      --width: 60px;
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

  /** Iniciales de las dos primeras palabras del nombre (igual que la tarjeta del recolector). */
  readonly initials = initialsOf;

  constructor() {
    addIcons({ personAddOutline, personOutline, callOutline, createOutline, trashOutline, chevronForward, peopleOutline });

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
      this.errorMessage.set(apiErrorMessage(err, 'Error al eliminar trabajador'));
      this.showError.set(true);
    } finally {
      this.cancelDelete();
    }
  }

  onDeleteConfirmDismiss(): void {
    this.cancelDelete();
  }
}