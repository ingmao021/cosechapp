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
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonToast } from '@ionic/angular/ion-toast';
import { addIcons } from 'ionicons';
import { addOutline, cashOutline, timeOutline, chevronForwardOutline, alertCircleOutline } from 'ionicons/icons';
import { AppChipComponent } from '@shared/components';
import { CurrencyPipe } from '@shared/pipes/currency.pipe';
import { DateFormatPipe } from '@shared/pipes/date.pipe';
import { KilosPipe } from '@shared/pipes/kilos.pipe';
import { HarvestFacade } from '../services/harvest.facade';
import { WeighingFacade } from '@weighing/services/weighing.facade';
import { PaymentFacade } from '@payment/services/payment.facade';

/**
 * Pantalla Detalle de Recolector — Tarea 3.4.
 * Pesadas del día, acumulados, chip alimentación, botón "Pagar ahora", historial pagos.
 * Conectado a HarvestFacade, WeighingFacade y PaymentFacade.
 */
@Component({
  selector: 'app-picker-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonChip,
    IonLabel,
    IonItem,
    IonList,
    IonToast,
    AppChipComponent,
    CurrencyPipe,
    DateFormatPipe,
    KilosPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-level-1">{{ pickerName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (harvestFacade.isLoading() || weighingFacade.isLoading() || paymentFacade.isLoading()) {
        <div class="loading-center">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else {
        <!-- Pesadas del día -->
        <ion-card class="section-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Pesadas de hoy</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (weighingFacade.todayWeighings().length === 0) {
              <p class="text-level-4 text-center ion-padding">Sin pesadas hoy</p>
            } @else {
              <ion-list lines="full">
                <ion-item *ngFor="let w of weighingFacade.todayWeighings()" lines="full">
                  <ion-label>
                    <h3 class="text-level-3">{{ w.kilograms | kilos }}</h3>
                    <p class="text-level-4">{{ w.dateTime | dateFormat:'time' }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            }
            <ion-button fill="solid" color="primary" expand="block" class="ion-margin-top" (click)="addWeighing()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Agregar pesada
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Acumulados -->
        <ion-card class="section-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Acumulados</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="accumulators-grid">
              <div class="acc-item">
                <p class="text-level-4">Esta semana</p>
                <p class="text-level-3">{{ weighingFacade.weeklyKilos() | kilos }}</p>
              </div>
              <div class="acc-item">
                <p class="text-level-4">Ciclo completo</p>
                <p class="text-level-3">{{ weighingFacade.totalKilos() | kilos }}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Alimentación -->
        <ion-card class="section-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Alimentación</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <app-chip [variant]="currentPicker()?.hasMeals ? 'meal-with' : 'meal-without'" [icon]="currentPicker()?.hasMeals ? 'restaurant-outline' : 'restaurant-off-outline'">
              {{ currentPicker()?.hasMeals ? 'Con alimentación' : 'Sin alimentación' }}
            </app-chip>
            @if (currentPicker()?.hasMeals && currentPicker()?.mealDetail) {
              <p class="text-level-4 ion-margin-top">{{ currentPicker()?.mealDetail }}</p>
            }
          </ion-card-content>
        </ion-card>

        <!-- Pagar ahora -->
        <ion-card class="section-card pay-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Pagar ahora</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="pay-summary">
              <p class="text-level-3">Monto a pagar: <span class="pay-amount">{{ paymentFacade.payNowResult()?.amountDue ?? 0 | currency }}</span></p>
              <p class="text-level-4">(Kilos totales × precio/kilo - alimentación)</p>
              <p class="text-level-4" *ngIf="paymentFacade.payNowResult()">Kilos: {{ paymentFacade.payNowResult()!.totalKilograms | kilos }}</p>
            </div>
            <ion-button
              fill="solid"
              color="primary"
              expand="block"
              class="ion-margin-top"
              (click)="payNow()"
              [disabled]="paymentFacade.isLoading()"
            >
              <ion-icon name="cash-outline" slot="start"></ion-icon>
              {{ paymentFacade.isLoading() ? 'Procesando...' : 'Pagar ahora' }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Historial de pagos -->
        <ion-card class="section-card">
          <ion-card-header>
            <ion-card-title class="text-level-2">Historial de pagos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (paymentFacade.payments().length === 0) {
              <p class="text-level-4 text-center ion-padding">Sin pagos registrados</p>
            } @else {
              <ion-list lines="full">
                <ion-item *ngFor="let p of paymentFacade.payments()" lines="full">
                  <ion-label>
                    <h3 class="text-level-3">{{ p.amount | currency }}</h3>
                    <p class="text-level-4">{{ p.dateTime | dateFormat:'short' }}</p>
                    @if (p.includesMeals) {
                      <p class="text-level-4" style="color: var(--color-primary);">
                        <ion-icon name="restaurant-outline" size="small"></ion-icon>
                        Incluye alimentación
                      </p>
                    }
                  </ion-label>
                </ion-item>
              </ion-list>
            }
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .section-card {
      --border-radius: var(--radius-md);
      --box-shadow: var(--shadow-card);
      margin-bottom: var(--spacing-md);
    }
    .accumulators-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }
    .acc-item {
      text-align: center;
      padding: var(--spacing-sm);
    }
    .pay-card {
      border: 2dp solid var(--color-primary);
    }
    .pay-summary {
      text-align: center;
      margin-bottom: var(--spacing-sm);
    }
    .pay-amount {
      font-family: var(--font-family-display);
      color: var(--color-primary);
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
  `],
})
export class PickerDetailPage {
  protected readonly harvestFacade = inject(HarvestFacade);
  protected readonly weighingFacade = inject(WeighingFacade);
  protected readonly paymentFacade = inject(PaymentFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  pickerId = computed(() => this.route.snapshot.paramMap.get('pickerId'));
  pickerName = 'Cargando...';

  currentPicker = computed(() => {
    const id = this.pickerId();
    if (!id) return null;
    return this.harvestFacade.activeHarvestPickers().find((p: { id: string }) => p.id === id) ?? null;
  });

  constructor() {
    addIcons({ addOutline, cashOutline, timeOutline, chevronForwardOutline, alertCircleOutline });

    // Cargar datos al navegar a la página
    effect(() => {
      const id = this.pickerId();
      if (id) {
        this.pickerName = 'Cargando...';
        this.loadPickerData(id);
      }
    });
  }

  async loadPickerData(id: string): Promise<void> {
    try {
      // Buscar picker en la lista activa
      const picker = this.harvestFacade.activeHarvestPickers().find((p: { id: string }) => p.id === id);
      if (picker) {
        this.pickerName = picker.harvestAlias ?? picker.workerId;

        // Cargar datos en paralelo
        await Promise.all([
          this.weighingFacade.loadTodayWeighings(id),
          this.weighingFacade.loadWeighingsForPicker(id),
          this.weighingFacade.getWeeklyTotal(id),
          this.weighingFacade.getTotalKilos(id),
          this.paymentFacade.loadPaymentsForPicker(id),
          this.paymentFacade.getTotalPaid(id),
        ]);
        this.pickerName = picker.harvestAlias ?? picker.workerId;
      }
    } catch (err: any) {
      console.error('Error loading picker data:', err);
    }
  }

  addWeighing(): void {
    const id = this.pickerId();
    if (id) {
      this.router.navigate(['/harvest/pickers', id, 'weighing', 'new']);
    }
  }

  async payNow(): Promise<void> {
    const id = this.pickerId();
    const harvestId = this.harvestFacade.activeHarvest()?.id;
    if (!id || !harvestId) return;

    const picker = this.currentPicker();
    const includesMeals = picker?.hasMeals ?? false;
    const mealDetail = picker?.mealDetail ?? '';

    try {
      await this.paymentFacade.payNow({
        harvestPickerId: id,
        harvestId,
        includesMeals,
        mealDetail,
      });
    } catch (err: any) {
      console.error('Error paying:', err);
    }
  }
}