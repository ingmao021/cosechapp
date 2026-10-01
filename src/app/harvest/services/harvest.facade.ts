import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HarvestService, HarvestResponse, HarvestSummaryResponse, PickerStatsResponse, CrewResponse } from './harvest.service';
import { apiErrorMessage } from '../../shared/utils';
import { OfflineStore } from '../../sync/services/offline-store';

/** Lo que se guarda en el teléfono para poder consultar la cosecha activa sin señal. */
interface ActiveHarvestSnapshot {
  harvest: HarvestResponse | null;
  pickers: PickerStatsResponse[];
  crews: CrewResponse[];
}

const SNAPSHOT_KEY = 'activeHarvest';

const isOffline = (err: unknown) => err instanceof HttpErrorResponse && err.status === 0;

/**
 * Facade de Cosecha: estado (signals) de la cosecha activa, sus recolectores y cuadrillas.
 *
 * Sin conexión, las lecturas usan la última copia guardada en el teléfono y
 * `dataSavedAt` indica de cuándo es. Las escrituras (abrir, cerrar, asignar, cuadrillas)
 * requieren conexión.
 */
@Injectable({ providedIn: 'root' })
export class HarvestFacade {
  private readonly harvestService = inject(HarvestService);
  private readonly router = inject(Router);
  private readonly offlineStore = inject(OfflineStore);

  private readonly _activeHarvest = signal<HarvestResponse | null>(null);
  private readonly _activeHarvestPickers = signal<PickerStatsResponse[]>([]);
  private readonly _activeHarvestCrews = signal<CrewResponse[]>([]);
  private readonly _allHarvests = signal<HarvestSummaryResponse[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _dataSavedAt = signal<string | null>(null);

  readonly activeHarvest = this._activeHarvest.asReadonly();
  readonly activeHarvestPickers = this._activeHarvestPickers.asReadonly();
  readonly activeHarvestCrews = this._activeHarvestCrews.asReadonly();
  readonly allHarvests = this._allHarvests.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  /** Fecha (ISO) de la copia local en pantalla; null si los datos vienen del servidor. */
  readonly dataSavedAt = this._dataSavedAt.asReadonly();

  readonly hasActiveHarvest = computed(() => this._activeHarvest() !== null);
  readonly activeHarvestName = computed(() => this._activeHarvest()?.name ?? '');
  readonly activeHarvestPrice = computed(() => this._activeHarvest()?.pricePerKilogram ?? 0);

  pickerById(pickerId: string): PickerStatsResponse | null {
    return this._activeHarvestPickers().find((picker) => picker.id === pickerId) ?? null;
  }

  crewById(crewId: string): CrewResponse | null {
    return this._activeHarvestCrews().find((crew) => crew.id === crewId) ?? null;
  }

  /** Cosecha activa con sus recolectores y cuadrillas. Sin señal, usa la copia local. */
  async loadActiveHarvest(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const harvest = await firstValueFrom(this.harvestService.getActiveHarvest());
      const [pickers, crews] = harvest
        ? await Promise.all([
            firstValueFrom(this.harvestService.getPickers(harvest.id)),
            firstValueFrom(this.harvestService.listCrews(harvest.id)),
          ])
        : [[], []];
      this.setActive({ harvest, pickers, crews });
      this._dataSavedAt.set(null);
    } catch (err: unknown) {
      if (!isOffline(err) || !this.restoreSnapshot()) {
        this._error.set(apiErrorMessage(err, 'No se pudo cargar la cosecha activa.'));
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadAllHarvests(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      this._allHarvests.set(await firstValueFrom(this.harvestService.getAllHarvests()));
    } catch (err: unknown) {
      this._error.set(apiErrorMessage(err, 'No se pudo cargar el historial de cosechas.'));
    } finally {
      this._isLoading.set(false);
    }
  }

  async openHarvest(name: string, pricePerKilogram: number): Promise<void> {
    await this.run('No se pudo abrir la cosecha.', async () => {
      const harvest = await firstValueFrom(this.harvestService.openHarvest({ name, pricePerKilogram }));
      this.setActive({ harvest, pickers: [], crews: [] });
      await this.router.navigate(['/home'], { replaceUrl: true });
    });
  }

  /** Cierra la cosecha: ya no se pueden registrar pesadas ni pagos. */
  async closeHarvest(harvestId: string): Promise<HarvestResponse> {
    return this.run('No se pudo cerrar la cosecha.', async () => {
      const harvest = await firstValueFrom(this.harvestService.closeHarvest(harvestId));
      this.setActive({ harvest: null, pickers: [], crews: [] });
      return harvest;
    });
  }

  /**
   * Agrega un trabajador del catálogo a la cosecha activa, en una cuadrilla.
   * Si ya estaba en la cosecha, lo mueve a esa cuadrilla.
   */
  async assignWorkerToHarvest(workerId: string, crewId?: string, harvestAlias?: string): Promise<void> {
    const harvest = this.requireActive();
    await this.run('No se pudo agregar el recolector.', async () => {
      await firstValueFrom(this.harvestService.assignWorker(harvest.id, { workerId, crewId, harvestAlias }));
      await this.loadPickers(harvest.id);
    });
  }

  async archiveWorker(pickerId: string): Promise<void> {
    const harvest = this.requireActive();
    await this.run('No se pudo archivar el recolector.', async () => {
      await firstValueFrom(this.harvestService.archiveWorker(harvest.id, pickerId));
      await this.loadPickers(harvest.id);
    });
  }

  async createCrew(name: string): Promise<void> {
    const harvest = this.requireActive();
    await this.run('No se pudo crear la cuadrilla.', async () => {
      await firstValueFrom(this.harvestService.createCrew(harvest.id, { name }));
      await this.loadCrews(harvest.id);
    });
  }

  async updateCrew(crewId: string, name: string): Promise<void> {
    const harvest = this.requireActive();
    await this.run('No se pudo actualizar la cuadrilla.', async () => {
      await firstValueFrom(this.harvestService.updateCrew(harvest.id, crewId, { name }));
      await this.loadCrews(harvest.id);
    });
  }

  async deleteCrew(crewId: string): Promise<void> {
    const harvest = this.requireActive();
    await this.run('No se pudo eliminar la cuadrilla.', async () => {
      await firstValueFrom(this.harvestService.deleteCrew(harvest.id, crewId));
      await this.loadCrews(harvest.id);
    });
  }

  async loadPickers(harvestId: string): Promise<void> {
    try {
      this._activeHarvestPickers.set(await firstValueFrom(this.harvestService.getPickers(harvestId)));
      this.saveSnapshot();
    } catch (err: unknown) {
      if (!isOffline(err)) this._error.set(apiErrorMessage(err, 'No se pudieron cargar los recolectores.'));
    }
  }

  async loadCrews(harvestId: string): Promise<void> {
    try {
      this._activeHarvestCrews.set(await firstValueFrom(this.harvestService.listCrews(harvestId)));
      this.saveSnapshot();
    } catch (err: unknown) {
      if (!isOffline(err)) this._error.set(apiErrorMessage(err, 'No se pudieron cargar las cuadrillas.'));
    }
  }

  /**
   * Suma a los acumulados en pantalla una pesada guardada sin señal, para que el
   * recolector vea sus kilos aunque todavía no lleguen al servidor.
   */
  applyLocalWeighing(pickerId: string, kilograms: number): void {
    const price = this.activeHarvestPrice();
    this._activeHarvestPickers.update((pickers) =>
      pickers.map((picker) =>
        picker.id === pickerId
          ? {
              ...picker,
              todayKilograms: picker.todayKilograms + kilograms,
              weekKilograms: picker.weekKilograms + kilograms,
              totalKilograms: picker.totalKilograms + kilograms,
              balanceDue: picker.balanceDue + kilograms * price,
            }
          : picker,
      ),
    );
    this.saveSnapshot();
  }

  /** Al cerrar sesión: no deben quedar en memoria datos de la cuenta anterior. */
  reset(): void {
    this._activeHarvest.set(null);
    this._activeHarvestPickers.set([]);
    this._activeHarvestCrews.set([]);
    this._allHarvests.set([]);
    this._dataSavedAt.set(null);
    this._error.set(null);
  }

  clearError(): void {
    this._error.set(null);
  }

  private setActive(snapshot: ActiveHarvestSnapshot): void {
    this._activeHarvest.set(snapshot.harvest);
    this._activeHarvestPickers.set(snapshot.pickers);
    this._activeHarvestCrews.set(snapshot.crews);
    this.saveSnapshot();
  }

  private saveSnapshot(): void {
    this.offlineStore.saveSnapshot<ActiveHarvestSnapshot>(SNAPSHOT_KEY, {
      harvest: this._activeHarvest(),
      pickers: this._activeHarvestPickers(),
      crews: this._activeHarvestCrews(),
    });
  }

  private restoreSnapshot(): boolean {
    const snapshot = this.offlineStore.readSnapshot<ActiveHarvestSnapshot>(SNAPSHOT_KEY);
    if (!snapshot) return false;
    this._activeHarvest.set(snapshot.value.harvest);
    this._activeHarvestPickers.set(snapshot.value.pickers);
    this._activeHarvestCrews.set(snapshot.value.crews);
    this._dataSavedAt.set(snapshot.savedAt);
    return true;
  }

  private requireActive(): HarvestResponse {
    const harvest = this._activeHarvest();
    if (!harvest) {
      this._error.set('No hay cosecha activa.');
      throw new Error('No hay cosecha activa');
    }
    return harvest;
  }

  /** Ejecuta una escritura con indicador de carga; deja el mensaje en `error` y relanza. */
  private async run<T>(fallback: string, action: () => Promise<T>): Promise<T> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      return await action();
    } catch (err: unknown) {
      this._error.set(apiErrorMessage(err, fallback));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }
}
