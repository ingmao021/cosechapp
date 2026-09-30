import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HarvestService, HarvestResponse, HarvestWorkerResponse, CrewResponse, OpenHarvestDto, AssignWorkerDto, CreateCrewDto, UpdateCrewDto } from './harvest.service';

/**
 * Facade de Cosecha — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - activeHarvest: HarvestResponse | null
 * - activeHarvestPickers: HarvestWorkerResponse[]
 * - activeHarvestCrews: CrewResponse[]
 * - allHarvests: HarvestResponse[]
 * - isLoading: boolean
 * - error: string | null
 *
 * Métodos de acción:
 * - loadActiveHarvest(): carga cosecha activa al entrar a la app
 * - loadAllHarvests(): carga historial
 * - openHarvest(name, pricePerKilogram)
 * - closeHarvest(harvestId)
 * - assignWorkerToHarvest(workerId, harvestAlias?)
 * - archiveWorker(pickerId)
 * - createCrew(name)
 * - updateCrew(crewId, name)
 * - deleteCrew(crewId)
 * - loadPickers(harvestId)
 * - loadCrews(harvestId)
 *
 * Delega llamadas HTTP al HarvestService.
 */
@Injectable({ providedIn: 'root' })
export class HarvestFacade {
  private readonly harvestService = inject(HarvestService);
  private readonly router = inject(Router);

  // Estado privado (signals)
  private readonly _activeHarvest = signal<HarvestResponse | null>(null);
  private readonly _activeHarvestPickers = signal<HarvestWorkerResponse[]>([]);
  private readonly _activeHarvestCrews = signal<CrewResponse[]>([]);
  private readonly _allHarvests = signal<HarvestResponse[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly activeHarvest = this._activeHarvest.asReadonly();
  readonly activeHarvestPickers = this._activeHarvestPickers.asReadonly();
  readonly activeHarvestCrews = this._activeHarvestCrews.asReadonly();
  readonly allHarvests = this._allHarvests.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed para comodidad en templates
  readonly hasActiveHarvest = computed(() => this._activeHarvest() !== null);
  readonly activeHarvestName = computed(() => this._activeHarvest()?.name ?? '');
  readonly activeHarvestPrice = computed(() => this._activeHarvest()?.pricePerKilogram ?? 0);
  readonly activeHarvestStatus = computed(() => this._activeHarvest()?.status ?? '');

  /**
   * Carga la cosecha activa al iniciar la app o al navegar a Home.
   * Si no hay cosecha activa, navega a Home (que mostrará estado vacío).
   */
  async loadActiveHarvest(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const harvest = await this.harvestService.getActiveHarvest().toPromise();
      this._activeHarvest.set(harvest ?? null);

      if (harvest) {
        await this.loadPickers(harvest.id);
        await this.loadCrews(harvest.id);
      } else {
        this._activeHarvestPickers.set([]);
        this._activeHarvestCrews.set([]);
      }
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar cosecha activa');
      this._activeHarvest.set(null);
      this._activeHarvestPickers.set([]);
      this._activeHarvestCrews.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Carga todas las cosechas (para historial).
   */
  async loadAllHarvests(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const harvests = await this.harvestService.getAllHarvests().toPromise();
      this._allHarvests.set(harvests ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar historial de cosechas');
      this._allHarvests.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Abre una nueva cosecha.
   * Navega a Home tras éxito.
   */
  async openHarvest(name: string, pricePerKilogram: number): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const dto: OpenHarvestDto = { name, pricePerKilogram };
      const harvest = await this.harvestService.openHarvest(dto).toPromise();

      if (harvest) {
        this._activeHarvest.set(harvest);
        this._activeHarvestPickers.set([]);
        this._activeHarvestCrews.set([]);
        await this.router.navigate(['/home'], { replaceUrl: true });
      } else {
        throw new Error('Respuesta inválida al abrir cosecha');
      }
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al abrir cosecha');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Cierra la cosecha activa.
   * Navega a flujo de cierre (venta/costos).
   */
  async closeHarvest(harvestId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const harvest = await this.harvestService.closeHarvest(harvestId).toPromise();

      if (harvest) {
        this._activeHarvest.set(harvest);
        // No navegar aquí - el componente decidirá a dónde ir (pantalla cierre)
      } else {
        throw new Error('Respuesta inválida al cerrar cosecha');
      }
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cerrar cosecha');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Asigna un trabajador del catálogo a la cosecha activa.
   */
  async assignWorkerToHarvest(workerId: string, harvestAlias?: string): Promise<void> {
    const harvest = this._activeHarvest();
    if (!harvest) {
      this._error.set('No hay cosecha activa');
      throw new Error('No hay cosecha activa');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const dto: AssignWorkerDto = { workerId, harvestAlias };
      const picker = await this.harvestService.assignWorker(harvest.id, dto).toPromise();

      if (picker) {
        // Recargar pickers para obtener lista actualizada con el nuevo
        await this.loadPickers(harvest.id);
      } else {
        throw new Error('Respuesta inválida al asignar trabajador');
      }
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al asignar trabajador');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Archiva un recolector en la cosecha activa.
   */
  async archiveWorker(pickerId: string): Promise<void> {
    const harvest = this._activeHarvest();
    if (!harvest) {
      this._error.set('No hay cosecha activa');
      throw new Error('No hay cosecha activa');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.harvestService.archiveWorker(harvest.id, pickerId).toPromise();
      await this.loadPickers(harvest.id);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al archivar recolector');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Crea una cuadrilla en la cosecha activa.
   */
  async createCrew(name: string): Promise<void> {
    const harvest = this._activeHarvest();
    if (!harvest) {
      this._error.set('No hay cosecha activa');
      throw new Error('No hay cosecha activa');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const dto: CreateCrewDto = { name };
      await this.harvestService.createCrew(harvest.id, dto).toPromise();
      await this.loadCrews(harvest.id);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al crear cuadrilla');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Actualiza una cuadrilla.
   */
  async updateCrew(crewId: string, name: string): Promise<void> {
    const harvest = this._activeHarvest();
    if (!harvest) {
      this._error.set('No hay cosecha activa');
      throw new Error('No hay cosecha activa');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const dto: UpdateCrewDto = { name };
      await this.harvestService.updateCrew(harvest.id, crewId, dto).toPromise();
      await this.loadCrews(harvest.id);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al actualizar cuadrilla');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Elimina una cuadrilla.
   */
  async deleteCrew(crewId: string): Promise<void> {
    const harvest = this._activeHarvest();
    if (!harvest) {
      this._error.set('No hay cosecha activa');
      throw new Error('No hay cosecha activa');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.harvestService.deleteCrew(harvest.id, crewId).toPromise();
      await this.loadCrews(harvest.id);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al eliminar cuadrilla');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Carga los recolectores de una cosecha.
   */
  async loadPickers(harvestId: string): Promise<void> {
    try {
      const pickers = await this.harvestService.getPickers(harvestId).toPromise();
      this._activeHarvestPickers.set(pickers ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar recolectores');
      this._activeHarvestPickers.set([]);
    }
  }

  /**
   * Carga las cuadrillas de una cosecha.
   */
  async loadCrews(harvestId: string): Promise<void> {
    try {
      const crews = await this.harvestService.listCrews(harvestId).toPromise();
      this._activeHarvestCrews.set(crews ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar cuadrillas');
      this._activeHarvestCrews.set([]);
    }
  }

  /**
   * Limpia el error actual.
   */
  clearError(): void {
    this._error.set(null);
  }
}