import { Component, signal, inject, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonToast } from '@ionic/angular/ion-toast';
import { AppInputComponent } from '@shared/components/app-input.component';
import { AppButtonPrimaryComponent } from '@shared/components/app-button-primary.component';
import { addIcons } from 'ionicons';
import { alertCircleOutline, arrowBackOutline, createOutline, personAddOutline } from 'ionicons/icons';
import { WorkerFacade } from '../services/worker.facade';
import { HarvestFacade } from '../../harvest/services/harvest.facade';
import { apiErrorMessage } from '../../shared/utils';

/**
 * Crear/Editar trabajador — Template de formulario (Design System §2.1, §1.7):
 * nombre, apellido, alias y teléfono (opcionales).
 */
@Component({
  selector: 'app-worker-form',
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
    IonToast,
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
        <ion-title class="text-level-1">{{ isEditing() ? 'Editar trabajador' : 'Nuevo trabajador' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form class="form-page" (ngSubmit)="onSubmit()" #form="ngForm" novalidate>
        <p class="form-page__intro">
          El alias es el nombre con el que lo conoces en la finca; se muestra en las listas.
        </p>

        <div class="form-page__fields">
          <app-input
            label="Nombre"
            name="firstName"
            [(ngModel)]="firstName"
            required
            maxlength="50"
            autocomplete="given-name"
            errorMessage="Escribe el nombre."
          ></app-input>

          <app-input
            label="Apellido"
            name="lastName"
            [(ngModel)]="lastName"
            required
            maxlength="50"
            autocomplete="family-name"
            errorMessage="Escribe el apellido."
          ></app-input>

          <app-input
            label="Alias (opcional)"
            name="alias"
            [(ngModel)]="alias"
            maxlength="50"
            placeholder="Ej: Juancho"
          ></app-input>

          <app-input
            label="Teléfono (opcional)"
            type="tel"
            name="phoneNumber"
            [(ngModel)]="phoneNumber"
            maxlength="20"
            placeholder="Ej: 3001234567"
            inputmode="tel"
            autocomplete="tel"
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
          loadingText="Guardando..."
          [iconStart]="isEditing() ? 'create-outline' : 'person-add-outline'"
        >
          {{ isEditing() ? 'Guardar cambios' : 'Guardar trabajador' }}
        </app-button-primary>
      </form>

      <ion-toast
        [isOpen]="showSuccess()"
        [message]="isEditing() ? 'Trabajador actualizado.' : crewId ? 'Trabajador guardado y agregado a la cuadrilla.' : 'Trabajador guardado.'"
        duration="2000"
        position="bottom"
        color="success"
        (didDismiss)="showSuccess.set(false)"
      ></ion-toast>
    </ion-content>
  `,
})
export class WorkerFormPage {
  protected readonly workerFacade = inject(WorkerFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly harvestFacade = inject(HarvestFacade);
  /** Cuadrilla a la que se agrega el trabajador al crearlo (viene de "Agregar recolector"). */
  protected readonly crewId = this.route.snapshot.queryParamMap.get('crewId');

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly alias = signal('');
  readonly phoneNumber = signal('');
  readonly isLoading = this.workerFacade.isLoading;
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccess = signal(false);

  readonly workerId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly isEditing = computed(() => !!this.workerId());

  constructor() {
    addIcons({ alertCircleOutline, arrowBackOutline, createOutline, personAddOutline });

    effect(() => {
      const id = this.workerId();
      if (id) {
        this.loadWorker(id);
      }
    });
  }

  async loadWorker(id: string): Promise<void> {
    try {
      const worker = await this.workerFacade.getWorker(id);
      if (worker) {
        this.firstName.set(worker.firstName);
        this.lastName.set(worker.lastName);
        this.alias.set(worker.alias ?? '');
        this.phoneNumber.set(worker.phoneNumber ?? '');
      }
    } catch (err: unknown) {
      this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar los datos del trabajador.'));
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    const dto = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      alias: this.alias().trim() || undefined,
      phoneNumber: this.phoneNumber().trim() || undefined,
    };

    try {
      if (this.isEditing()) {
        await this.workerFacade.updateWorker(this.workerId()!, dto);
      } else {
        const worker = await this.workerFacade.createWorker(dto);
        // Creado desde "Agregar recolector": queda de una vez en esa cuadrilla.
        if (this.crewId) await this.harvestFacade.assignWorkerToHarvest(worker.id, this.crewId);
      }
      this.showSuccess.set(true);
      setTimeout(() => this.goBack(), 1500);
    } catch (err: unknown) {
      this.errorMessage.set(apiErrorMessage(err, 'No se pudo guardar el trabajador. Intenta de nuevo.'));
    }
  }

  goBack(): void {
    if (this.crewId) {
      this.router.navigate(['/harvest/crews', this.crewId], { replaceUrl: true });
    } else {
      this.router.navigate(['/worker/catalog']);
    }
  }
}
