import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSearchbar } from '@ionic/angular/ion-searchbar';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { addIcons } from 'ionicons';
import { personAddOutline, checkmarkCircle, swapHorizontalOutline, addCircleOutline } from 'ionicons/icons';
import { HarvestFacade } from '../services/harvest.facade';
import { WorkerFacade } from '../../worker/services/worker.facade';
import { WorkerResponse } from '../../worker/services/worker.service';
import { apiErrorMessage } from '../../shared/utils';

type WorkerState = 'available' | 'in-this-crew' | 'in-other-crew' | 'archived';

interface WorkerRow {
  worker: WorkerResponse;
  state: WorkerState;
  /** Nombre de la otra cuadrilla, si está en otra. */
  otherCrewName: string | null;
}

const normalize = (text: string) =>
  text
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Agregar recolector a una cuadrilla (Design System §1.4): elegir del catálogo de
 * trabajadores o crear uno nuevo. Un trabajador que ya está en otra cuadrilla de
 * la cosecha se puede mover a esta (con confirmación).
 */
@Component({
  selector: 'app-add-picker',
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
    IonSearchbar,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="crewUrl" text="" aria-label="Volver"></ion-back-button>
        </ion-buttons>
        <ion-title class="text-level-1">Agregar recolector</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page">
        <p class="form-page__intro">
          Toca un trabajador para agregarlo a <strong>{{ crewName() }}</strong>.
        </p>

        <ion-button expand="block" fill="outline" color="primary" (click)="createNewWorker()">
          <ion-icon name="add-circle-outline" slot="start"></ion-icon>
          Crear trabajador nuevo
        </ion-button>

        @if (workerFacade.workers().length > 0) {
          <ion-searchbar
            placeholder="Buscar por nombre o alias"
            [value]="query()"
            (ionInput)="query.set($any($event).detail.value ?? '')"
            [debounce]="150"
          ></ion-searchbar>
        }

        @if (workerFacade.isLoading() && workerFacade.workers().length === 0) {
          <div class="loading-center"><ion-spinner name="crescent"></ion-spinner></div>
        } @else if (workerFacade.workers().length === 0) {
          <p class="empty">Tu catálogo de trabajadores está vacío. Crea el primero con el botón de arriba.</p>
        } @else if (rows().length === 0) {
          <p class="empty">Ningún trabajador coincide con "{{ query() }}".</p>
        } @else {
          <ul class="worker-list">
            @for (row of rows(); track row.worker.id) {
              <li>
                <button
                  type="button"
                  class="worker-row"
                  [disabled]="row.state === 'in-this-crew' || row.state === 'archived' || busyId() !== null"
                  (click)="select(row)"
                >
                  <span class="worker-row__name">
                    {{ row.worker.displayName }}
                    @if (row.worker.alias) {
                      <small>{{ row.worker.firstName }} {{ row.worker.lastName }}</small>
                    }
                  </span>
                  <span class="worker-row__state">
                    @switch (row.state) {
                      @case ('in-this-crew') {
                        <ion-icon name="checkmark-circle" color="primary" aria-hidden="true"></ion-icon> En esta cuadrilla
                      }
                      @case ('in-other-crew') {
                        <ion-icon name="swap-horizontal-outline" aria-hidden="true"></ion-icon> En {{ row.otherCrewName }}
                      }
                      @case ('archived') {
                        Archivado en esta cosecha
                      }
                      @default {
                        @if (busyId() === row.worker.id) {
                          <ion-spinner name="crescent"></ion-spinner>
                        } @else {
                          <ion-icon name="person-add-outline" color="primary" aria-hidden="true"></ion-icon> Agregar
                        }
                      }
                    }
                  </span>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      max-width: 480px;
      margin: 0 auto;
      padding: var(--spacing-lg) var(--screen-margin);
    }
    ion-searchbar {
      padding: 0;
      --border-radius: var(--input-radius);
      --background: var(--color-surface);
    }
    .worker-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--card-gap-vertical);
    }
    .worker-row {
      width: 100%;
      min-height: var(--list-row-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) var(--list-row-padding-h);
      border: none;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
      font-family: var(--font-family-body);
      text-align: left;
      color: var(--color-text);
      cursor: pointer;
    }
    .worker-row:disabled {
      cursor: default;
      opacity: 0.7;
    }
    .worker-row__name {
      display: flex;
      flex-direction: column;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
    }
    .worker-row__name small {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-regular);
      color: var(--color-text-muted);
    }
    .worker-row__state {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      flex-shrink: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .worker-row__state ion-icon {
      font-size: 20px;
    }
    .empty {
      margin: 0;
      text-align: center;
      font-family: var(--font-family-body);
      color: var(--color-text-muted);
    }
    .loading-center {
      display: flex;
      justify-content: center;
      padding: var(--spacing-xl);
    }
  `],
})
export class AddPickerPage {
  private readonly harvestFacade = inject(HarvestFacade);
  protected readonly workerFacade = inject(WorkerFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  private readonly crewId = this.route.snapshot.paramMap.get('crewId') ?? '';
  protected readonly crewUrl = `/harvest/crews/${this.crewId}`;

  readonly query = signal('');
  readonly busyId = signal<string | null>(null);

  readonly crewName = computed(() => this.harvestFacade.crewById(this.crewId)?.name ?? 'la cuadrilla');

  /** Trabajadores del catálogo con su situación en la cosecha; disponibles primero. */
  readonly rows = computed<WorkerRow[]>(() => {
    const pickersByWorker = new Map(this.harvestFacade.activeHarvestPickers().map((p) => [p.workerId, p]));
    const order: Record<WorkerState, number> = { available: 0, 'in-other-crew': 1, 'in-this-crew': 2, archived: 3 };
    const term = normalize(this.query().trim());

    return this.workerFacade
      .workers()
      .filter((worker) => !term || normalize(`${worker.displayName} ${worker.firstName} ${worker.lastName}`).includes(term))
      .map((worker): WorkerRow => {
        const picker = pickersByWorker.get(worker.id);
        if (!picker) return { worker, state: 'available', otherCrewName: null };
        if (picker.status === 'archived') return { worker, state: 'archived', otherCrewName: null };
        if (picker.crewId === this.crewId) return { worker, state: 'in-this-crew', otherCrewName: null };
        const otherCrewName = picker.crewId ? this.harvestFacade.crewById(picker.crewId)?.name ?? 'otra cuadrilla' : 'sin cuadrilla';
        return { worker, state: 'in-other-crew', otherCrewName };
      })
      .sort((a, b) => order[a.state] - order[b.state] || a.worker.displayName.localeCompare(b.worker.displayName, 'es'));
  });

  constructor() {
    addIcons({ personAddOutline, checkmarkCircle, swapHorizontalOutline, addCircleOutline });
    this.workerFacade.loadWorkers();
    if (!this.harvestFacade.hasActiveHarvest()) {
      this.harvestFacade.loadActiveHarvest();
    }
  }

  async select(row: WorkerRow): Promise<void> {
    if (row.state === 'in-other-crew') {
      const confirmed = await this.confirmMove(row);
      if (!confirmed) return;
    }
    this.busyId.set(row.worker.id);
    try {
      await this.harvestFacade.assignWorkerToHarvest(row.worker.id, this.crewId);
      await this.showToast(`${row.worker.displayName} quedó en ${this.crewName()}.`, 'success');
      await this.router.navigateByUrl(this.crewUrl, { replaceUrl: true });
    } catch (err: unknown) {
      await this.showToast(apiErrorMessage(err, 'No se pudo agregar el recolector. Intenta de nuevo.'), 'danger');
    } finally {
      this.busyId.set(null);
    }
  }

  createNewWorker(): void {
    this.router.navigate(['/worker/create'], { queryParams: { crewId: this.crewId } });
  }

  private async confirmMove(row: WorkerRow): Promise<boolean> {
    const alert = await this.alertController.create({
      header: `¿Mover a ${row.worker.displayName}?`,
      message: `Está en ${row.otherCrewName}. Sus pesadas y pagos se conservan.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: `Mover a ${this.crewName()}`, role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2500, position: 'bottom' });
    await toast.present();
  }
}
