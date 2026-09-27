import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { WorkerService, CreateWorkerDto, UpdateWorkerDto, WorkerResponse } from './worker.service';

/**
 * Facade de Catálogo de Trabajadores — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - workers: WorkerResponse[]
 * - isLoading: boolean
 * - error: string | null
 *
 * Métodos de acción:
 * - loadWorkers(): carga la lista completa
 * - createWorker(dto)
 * - updateWorker(id, dto)
 * - deleteWorker(id)
 *
 * Delega llamadas HTTP al WorkerService.
 */
@Injectable({ providedIn: 'root' })
export class WorkerFacade {
  // Estado privado (signals)
  private readonly _workers = signal<WorkerResponse[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly workers = this._workers.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed para comodidad en templates
  readonly workersCount = computed(() => this._workers().length);

  constructor(
    private readonly workerService: WorkerService,
    private readonly router: Router
  ) {}

  /**
   * Carga la lista completa de trabajadores del catálogo.
   */
  async loadWorkers(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const workers = await this.workerService.listWorkers().toPromise();
      this._workers.set(workers ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar trabajadores');
      this._workers.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Crea un nuevo trabajador en el catálogo.
   * Navega a la lista tras éxito.
   */
  async createWorker(dto: CreateWorkerDto): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const worker = await this.workerService.createWorker(dto).toPromise();
      if (worker) {
        this._workers.update(current => [...current, worker]);
        await this.router.navigate(['/worker/catalog'], { replaceUrl: true });
      } else {
        throw new Error('Respuesta inválida al crear trabajador');
      }
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al crear trabajador');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Actualiza un trabajador existente.
   */
  async updateWorker(id: string, dto: UpdateWorkerDto): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const worker = await this.workerService.updateWorker(id, dto).toPromise();
      if (worker) {
        this._workers.update(current =>
          current.map(w => w.id === id ? worker : w)
        );
        await this.router.navigate(['/worker/catalog'], { replaceUrl: true });
      } else {
        throw new Error('Respuesta inválida al actualizar trabajador');
      }
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al actualizar trabajador');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Elimina un trabajador del catálogo.
   */
  async deleteWorker(id: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.workerService.deleteWorker(id).toPromise();
      this._workers.update(current => current.filter(w => w.id !== id));
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al eliminar trabajador');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Limpia el error actual.
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Obtiene un trabajador por ID.
   */
  async getWorker(id: string): Promise<WorkerResponse | null> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const worker = await this.workerService.getWorker(id).toPromise();
      return worker ?? null;
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar trabajador');
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }
}