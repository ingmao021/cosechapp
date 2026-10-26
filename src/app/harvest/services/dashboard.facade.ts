import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HarvestActivityResponse, HarvestDashboardResponse, HarvestService } from './harvest.service';
import { HarvestFacade } from './harvest.facade';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';
import { OfflineStore } from '../../sync/services/offline-store';
import { SyncFacade } from '../../sync/services/sync.facade';
import { addDaysToDateKey, apiErrorMessage, colombiaDateKey, daysBetweenDateKeys } from '../../shared/utils';

/** Kilos de café cereza por cada kilo seco (PRD 7.7: kilos secos proyectados = cereza ÷ 5). */
export const DRY_FACTOR = 5;
/** El precio FNC se publica por carga de 125 kg de café pergamino seco. */
export const FNC_LOAD_KG = 125;
/** Días del gráfico: hoy y los 6 anteriores. */
const CHART_DAYS = 7;
/** Movimientos en "Actividad reciente". */
const RECENT_ACTIVITY = 6;

const SNAPSHOT_KEY = 'dashboard';

/** Lo último recibido, con la cosecha a la que pertenece. */
interface DashboardSnapshot {
  harvestId: string;
  dashboard: HarvestDashboardResponse;
}

/** Un movimiento en "Actividad reciente"; `pending` = pesada guardada en el teléfono, sin enviar. */
export type DashboardActivity = HarvestActivityResponse & { pending: boolean };

/** Un día del gráfico. `inHarvest` es false para los días antes de abrir la cosecha. */
export interface DashboardDay {
  date: string;
  kilograms: number;
  inHarvest: boolean;
}

const isOffline = (err: unknown) => err instanceof HttpErrorResponse && err.status === 0;
const sum = <T>(items: T[], value: (item: T) => number) => items.reduce((total, item) => total + value(item), 0);

/**
 * Facade del dashboard de Inicio: kilos por día, actividad reciente y cifras de la
 * cosecha activa.
 *
 * Los acumulados salen de los recolectores de HarvestFacade, que ya incluyen las
 * pesadas guardadas sin señal; del servidor solo se pide lo que no está ahí (kilos de
 * días anteriores, últimos movimientos y costos). Sin señal usa la última copia.
 *
 * La ganancia es una estimación: con la cosecha abierta todavía no hay venta, así que
 * el ingreso se estima con el precio FNC del día.
 */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly harvestService = inject(HarvestService);
  private readonly harvestFacade = inject(HarvestFacade);
  private readonly priceAndNewsFacade = inject(PriceAndNewsFacade);
  private readonly offlineStore = inject(OfflineStore);
  private readonly sync = inject(SyncFacade);

  private readonly _snapshot = signal<DashboardSnapshot | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Datos del servidor, solo si son de la cosecha en pantalla (nunca los de otra cuenta o cosecha). */
  readonly dashboard = computed(() => {
    const snapshot = this._snapshot();
    return snapshot && snapshot.harvestId === this.harvestFacade.activeHarvest()?.id ? snapshot.dashboard : null;
  });

  private readonly pickers = this.harvestFacade.activeHarvestPickers;

  /** Día de la cosecha: 1 el día que se abrió (hora de Colombia). */
  readonly harvestDay = computed(() => {
    const harvest = this.harvestFacade.activeHarvest();
    if (!harvest) return 0;
    return Math.max(1, daysBetweenDateKeys(colombiaDateKey(harvest.openingDate), colombiaDateKey(new Date())) + 1);
  });

  readonly todayKilograms = computed(() => sum(this.pickers(), (picker) => picker.todayKilograms));

  /** null mientras no hay datos del servidor. */
  readonly yesterdayKilograms = computed(() => {
    const dashboard = this.dashboard();
    if (!dashboard) return null;
    const yesterday = addDaysToDateKey(colombiaDateKey(new Date()), -1);
    return dashboard.dailyKilograms.find((day) => day.date === yesterday)?.kilograms ?? 0;
  });

  /** Los 7 días del gráfico; hoy sale de los recolectores para incluir lo que está por enviar. */
  readonly dailySeries = computed<DashboardDay[]>(() => {
    const dashboard = this.dashboard();
    const harvest = this.harvestFacade.activeHarvest();
    if (!dashboard || !harvest) return [];
    const today = colombiaDateKey(new Date());
    const opening = colombiaDateKey(harvest.openingDate);
    const byDate = new Map(dashboard.dailyKilograms.map((day) => [day.date, day.kilograms]));
    return Array.from({ length: CHART_DAYS }, (_, index) => {
      const date = addDaysToDateKey(today, index - (CHART_DAYS - 1));
      return {
        date,
        kilograms: date === today ? this.todayKilograms() : (byDate.get(date) ?? 0),
        inHarvest: date >= opening,
      };
    });
  });

  /** Kilos de los 7 días del gráfico (para su frase resumen). */
  readonly weekKilograms = computed(() => sum(this.dailySeries(), (day) => day.kilograms));

  /** El día con más kilos de la semana; null si la semana está en cero. */
  readonly bestDay = computed(() => {
    const days = this.dailySeries().filter((day) => day.kilograms > 0);
    return days.length ? days.reduce((best, day) => (day.kilograms > best.kilograms ? day : best)) : null;
  });

  /** Recolectores con saldo, el mayor primero. */
  readonly pendingPickers = computed(() =>
    this.pickers()
      .filter((picker) => picker.balanceDue > 0)
      .sort((a, b) => b.balanceDue - a.balanceDue),
  );
  readonly pendingTotal = computed(() => sum(this.pendingPickers(), (picker) => picker.balanceDue));

  readonly totalKilograms = computed(() => sum(this.pickers(), (picker) => picker.totalKilograms));
  /** Efectivo pagado a recolectores. */
  readonly totalPaid = computed(() => sum(this.pickers(), (picker) => picker.totalPaid));
  readonly productionCosts = computed(() => this.dashboard()?.productionCosts ?? 0);

  readonly projectedDryKilograms = computed(() => this.totalKilograms() / DRY_FACTOR);

  /** Precio FNC por kilo seco (se publica por carga); null si no hay precio. */
  readonly pricePerDryKilogram = computed(() => {
    const price = this.priceAndNewsFacade.coffeePrice();
    return price ? price.value / FNC_LOAD_KG : null;
  });

  /** Lo recogido a precio FNC de hoy; null si no hay precio publicado. */
  readonly estimatedValue = computed(() => {
    const perKilogram = this.pricePerDryKilogram();
    return perKilogram === null ? null : this.projectedDryKilograms() * perKilogram;
  });

  /**
   * Ganancia bruta estimada: valor estimado − pagos a recolectores. Cuenta lo pagado y lo
   * que falta, porque al cerrar se les liquida todo lo pendiente.
   */
  readonly estimatedGrossProfit = computed(() => {
    const value = this.estimatedValue();
    return value === null ? null : value - this.pickerPayments();
  });

  /** Pagos a recolectores de la cosecha: lo pagado más lo que falta por pagar. */
  readonly pickerPayments = computed(() => this.totalPaid() + this.pendingTotal());

  /** Ganancia de la cosecha estimada: ganancia bruta − costos de producción. */
  readonly estimatedHarvestProfit = computed(() => {
    const gross = this.estimatedGrossProfit();
    return gross === null ? null : gross - this.productionCosts();
  });

  /** Últimos movimientos; las pesadas que siguen en el teléfono van marcadas como pendientes. */
  readonly recentActivity = computed<DashboardActivity[]>(() => {
    this.sync.pendingCount(); // la cola vive en el teléfono: se vuelve a leer cuando cambia
    const names = new Map(this.pickers().map((picker) => [picker.id, picker.displayName]));
    const queued: DashboardActivity[] = this.offlineStore
      .pendingWeighings()
      .filter((weighing) => names.has(weighing.harvestPickerId))
      .map((weighing) => ({
        type: 'weighing',
        id: weighing.id,
        pickerId: weighing.harvestPickerId,
        displayName: names.get(weighing.harvestPickerId) ?? '',
        kilograms: weighing.kilograms,
        dateTime: weighing.dateTime,
        pending: true,
      }));
    const queuedIds = new Set(queued.map((item) => item.id));
    const sent: DashboardActivity[] = (this.dashboard()?.recentActivity ?? [])
      .filter((item) => !queuedIds.has(item.id))
      .map((item) => ({ ...item, pending: false }));
    return [...queued, ...sent]
      .sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime))
      .slice(0, RECENT_ACTIVITY);
  });

  /** Pide el resumen de la cosecha activa. Sin señal, muestra la última copia guardada. */
  async load(): Promise<void> {
    const harvest = this.harvestFacade.activeHarvest();
    if (!harvest) return;
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const dashboard = await firstValueFrom(this.harvestService.getDashboard(harvest.id));
      const snapshot = { harvestId: harvest.id, dashboard };
      this._snapshot.set(snapshot);
      this.offlineStore.saveSnapshot<DashboardSnapshot>(SNAPSHOT_KEY, snapshot);
    } catch (err: unknown) {
      if (!isOffline(err) || !this.restoreSnapshot(harvest.id)) {
        this._error.set(apiErrorMessage(err, 'No se pudo cargar el resumen de la cosecha.'));
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  private restoreSnapshot(harvestId: string): boolean {
    const saved = this.offlineStore.readSnapshot<DashboardSnapshot>(SNAPSHOT_KEY);
    if (!saved || saved.value.harvestId !== harvestId) return false;
    this._snapshot.set(saved.value);
    return true;
  }
}
