import { Injectable } from '@angular/core';

/** Pesada registrada sin señal, pendiente de enviar al servidor. */
export interface PendingWeighing {
  /** UUID generado en el teléfono: hace idempotente el envío. */
  id: string;
  harvestPickerId: string;
  kilograms: number;
  /** Fecha real de la pesada (ISO), no la del envío. */
  dateTime: string;
  /** Intentos fallidos por error de servidor (para reintentar con espera creciente). */
  attempts: number;
}

/** Pesada que el servidor rechazó (ej. recolector archivado). Se informa al usuario. */
export interface RejectedWeighing extends PendingWeighing {
  reason: string;
}

export interface Snapshot<T> {
  value: T;
  savedAt: string;
}

const PREFIX = 'cosechapp:';
const OUTBOX_KEY = `${PREFIX}outbox:weighings`;
const REJECTED_KEY = `${PREFIX}outbox:rejected`;

/**
 * Almacenamiento local para trabajar sin señal (Design System §1.6):
 * - Instantáneas del último dato recibido del servidor, para consultar sin conexión.
 * - Cola de pesadas pendientes de enviar.
 *
 * Usa el localStorage del WebView, que en Android persiste con los datos de la app.
 * Cualquier fallo de almacenamiento se trata como "no hay dato": nunca rompe la pantalla.
 */
@Injectable({ providedIn: 'root' })
export class OfflineStore {
  saveSnapshot<T>(key: string, value: T): void {
    this.write(`${PREFIX}cache:${key}`, { value, savedAt: new Date().toISOString() } satisfies Snapshot<T>);
  }

  readSnapshot<T>(key: string): Snapshot<T> | null {
    return this.read<Snapshot<T>>(`${PREFIX}cache:${key}`);
  }

  /** Borra todo lo guardado: al cerrar sesión no deben quedar datos de otra cuenta. */
  clearAll(): void {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(PREFIX))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  pendingWeighings(): PendingWeighing[] {
    return this.read<PendingWeighing[]>(OUTBOX_KEY) ?? [];
  }

  enqueueWeighing(weighing: Omit<PendingWeighing, 'attempts'>): void {
    this.write(OUTBOX_KEY, [...this.pendingWeighings(), { ...weighing, attempts: 0 }]);
  }

  removePending(ids: string[]): void {
    const remove = new Set(ids);
    this.write(OUTBOX_KEY, this.pendingWeighings().filter((w) => !remove.has(w.id)));
  }

  markAttempt(ids: string[]): void {
    const retry = new Set(ids);
    this.write(
      OUTBOX_KEY,
      this.pendingWeighings().map((w) => (retry.has(w.id) ? { ...w, attempts: w.attempts + 1 } : w)),
    );
  }

  rejectedWeighings(): RejectedWeighing[] {
    return this.read<RejectedWeighing[]>(REJECTED_KEY) ?? [];
  }

  addRejected(items: RejectedWeighing[]): void {
    this.write(REJECTED_KEY, [...this.rejectedWeighings(), ...items]);
  }

  clearRejected(): void {
    this.write(REJECTED_KEY, []);
  }

  private read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* almacenamiento lleno o no disponible: se pierde solo la caché, no la sesión */
    }
  }
}
