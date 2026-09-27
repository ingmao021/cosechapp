import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonToast } from '@ionic/angular/ion-toast';
import { AppInputComponent } from '@shared/components/app-input.component';
import { AppButtonPrimaryComponent } from '@shared/components/app-button-primary.component';
import { AppAvatarComponent } from '@shared/components/app-avatar.component';
import { addIcons } from 'ionicons';
import { arrowBackOutline, personAddOutline, cameraOutline } from 'ionicons/icons';
import { WorkerFacade } from '../services/worker.facade';

/**
 * Pantalla Crear/Editar Trabajador — Tarea 3.1.
 * Formulario con nombre, apellido, alias opcional, teléfono opcional, foto opcional.
 */
@Component({
  selector: 'app-worker-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonToast,
    AppInputComponent,
    AppButtonPrimaryComponent,
    AppAvatarComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goBack()">
            <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="text-level-1">{{ isEditing() ? 'Editar trabajador' : 'Nuevo trabajador' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card class="auth-card">
        <ion-card-header class="text-center">
          <ion-card-title class="text-level-1">{{ isEditing() ? 'Editar trabajador' : 'Nuevo trabajador' }}</ion-card-title>
          <ion-card-subtitle class="text-level-4">{{ isEditing() ? 'Actualiza los datos' : 'Completa la información' }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <!-- Foto opcional -->
          <div class="avatar-section text-center">
            <app-avatar
              [src]="profilePhoto()"
              [fallbackIcon]="'person-add-outline'"
              [clickable]="true"
              (click)="pickProfilePhoto()"
            ></app-avatar>
            <p class="text-level-4 ion-margin-top">Foto opcional (tap para cambiar)</p>
          </div>

          <!-- Formulario -->
          <form (ngSubmit)="onSubmit()" #form="ngForm">
            <app-input
              label="Nombre"
              type="text"
              name="firstName"
              [(ngModel)]="firstName"
              required
              maxlength="50"
              (valueChange)="firstName = $event"
            ></app-input>

            <app-input
              label="Apellido"
              type="text"
              name="lastName"
              [(ngModel)]="lastName"
              required
              maxlength="50"
              (valueChange)="lastName = $event"
            ></app-input>

            <app-input
              label="Alias (opcional)"
              type="text"
              name="alias"
              [(ngModel)]="alias"
              maxlength="50"
              placeholder="Ej: Juancho"
              (valueChange)="alias = $event"
            ></app-input>

            <app-input
              label="Teléfono (opcional)"
              type="tel"
              name="phoneNumber"
              [(ngModel)]="phoneNumber"
              maxlength="20"
              placeholder="Ej: 3001234567"
              inputmode="tel"
              (valueChange)="phoneNumber = $event"
            ></app-input>

            <app-button-primary
              type="submit"
              [loading]="isLoading()"
              [disabled]="form.invalid"
              [loadingText]="isEditing() ? 'Actualizando...' : 'Guardando...'"
              [iconStart]="isEditing() ? 'create-outline' : 'person-add-outline'"
            >
              {{ isEditing() ? 'Actualizar' : 'Guardar' }}
            </app-button-primary>
          </form>
        </ion-card-content>
      </ion-card>

      <!-- Toast error -->
      <ion-toast
        [isOpen]="showError()"
        [message]="errorMessage()"
        duration="3000"
        position="bottom"
        color="danger"
        (didDismiss)="showError.set(false)"
      ></ion-toast>

      <!-- Toast éxito -->
      <ion-toast
        [isOpen]="showSuccess()"
        [message]="isEditing() ? 'Trabajador actualizado' : 'Trabajador creado'"
        duration="2000"
        position="bottom"
        color="success"
        (didDismiss)="showSuccess.set(false)"
      ></ion-toast>
    </ion-content>
  `,
  styles: [`
    .auth-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      max-width: 400px;
      margin: var(--spacing-xl) auto;
    }
    .text-center {
      text-align: center;
    }
    .avatar-section {
      margin-bottom: var(--spacing-lg);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
  `],
})
export class WorkerFormPage {
  protected readonly workerFacade = inject(WorkerFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  firstName = '';
  lastName = '';
  alias = '';
  phoneNumber = '';
  profilePhoto = signal<string | null>(null);
  isLoading = this.workerFacade.isLoading;
  showError = signal(false);
  errorMessage = signal('');
  showSuccess = signal(false);

  workerId = computed(() => this.route.snapshot.paramMap.get('id'));
  isEditing = computed(() => !!this.workerId());

  constructor() {
    addIcons({ arrowBackOutline, personAddOutline, cameraOutline });

    // Cargar datos si estamos editando
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
        this.firstName = worker.firstName;
        this.lastName = worker.lastName;
        this.alias = worker.alias ?? '';
        this.phoneNumber = worker.phoneNumber ?? '';
        this.profilePhoto.set(null); // TODO: cargar foto si existe
      }
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? 'Error al cargar trabajador');
      this.showError.set(true);
    }
  }

  pickProfilePhoto(): void {
    console.log('Seleccionar foto de perfil');
  }

  async onSubmit(): Promise<void> {
    const dto = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      alias: this.alias.trim() || undefined,
      phoneNumber: this.phoneNumber.trim() || undefined,
    };

    try {
      if (this.isEditing()) {
        await this.workerFacade.updateWorker(this.workerId()!, dto);
      } else {
        await this.workerFacade.createWorker(dto);
      }
      this.showSuccess.set(true);
      setTimeout(() => this.goBack(), 2000);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? 'Error al guardar trabajador');
      this.showError.set(true);
    }
  }

  goBack(): void {
    this.router.navigate(['/worker/catalog']);
  }
}