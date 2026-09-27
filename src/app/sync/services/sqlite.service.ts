import { Injectable, signal, computed } from '@angular/core';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

/**
 * Esquema de la base de datos local (SQLite)
 * Espejo de las entidades principales del backend
 */
export const SQLITE_SCHEMA = `
-- Cosechas
CREATE TABLE IF NOT EXISTS harvests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_kilogram REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'closed')),
  opening_date TEXT NOT NULL,
  closing_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL
);

-- Trabajadores del catálogo
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  alias TEXT,
  phone_number TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL
);

-- Recolectores asignados a cosecha
CREATE TABLE IF NOT EXISTS harvest_pickers (
  id TEXT PRIMARY KEY,
  harvest_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  harvest_alias TEXT,
  crew_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
  has_meals INTEGER NOT NULL DEFAULT 0,
  meal_detail TEXT,
  total_paid REAL DEFAULT 0,
  total_kilograms REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL,
  FOREIGN KEY (harvest_id) REFERENCES harvests(id)
);

-- Cuadrillas
CREATE TABLE IF NOT EXISTS crews (
  id TEXT PRIMARY KEY,
  harvest_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL,
  FOREIGN KEY (harvest_id) REFERENCES harvests(id)
);

-- Pesadas
CREATE TABLE IF NOT EXISTS weighings (
  id TEXT PRIMARY KEY,
  harvest_picker_id TEXT NOT NULL,
  kilograms REAL NOT NULL,
  date_time TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL,
  FOREIGN KEY (harvest_picker_id) REFERENCES harvest_pickers(id)
);

-- Pagos
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  harvest_picker_id TEXT NOT NULL,
  amount REAL NOT NULL,
  includes_meals INTEGER NOT NULL DEFAULT 0,
  meal_detail TEXT,
  date_time TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL,
  FOREIGN KEY (harvest_picker_id) REFERENCES harvest_pickers(id)
);

-- Costos de producción
CREATE TABLE IF NOT EXISTS production_costs (
  id TEXT PRIMARY KEY,
  harvest_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL,
  FOREIGN KEY (harvest_id) REFERENCES harvests(id)
);

-- Ventas
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  harvest_id TEXT NOT NULL UNIQUE,
  actual_dry_kilograms REAL NOT NULL,
  sale_price REAL NOT NULL,
  date TEXT NOT NULL,
  gross_revenue REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL,
  FOREIGN KEY (harvest_id) REFERENCES harvests(id)
);

-- Costos de producción (para ventas)
CREATE TABLE IF NOT EXISTS sale_production_costs (
  id TEXT PRIMARY KEY,
  harvest_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  local_timestamp INTEGER NOT NULL,
  FOREIGN KEY (harvest_id) REFERENCES harvests(id)
);

-- Precio FNC
CREATE TABLE IF NOT EXISTS coffee_prices (
  id TEXT PRIMARY KEY,
  value REAL NOT NULL,
  query_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  coffee_grower_id TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'synced'
);

-- Cola de sincronización (operaciones pendientes)
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  entity_id TEXT NOT NULL,
  data TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_harvest_pickers_harvest ON harvest_pickers(harvest_id);
CREATE INDEX IF NOT EXISTS idx_weighings_picker ON weighings(harvest_picker_id);
CREATE INDEX IF NOT EXISTS idx_payments_picker ON payments(harvest_picker_id);
CREATE INDEX IF NOT EXISTS idx_costs_harvest ON production_costs(harvest_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);
`;

export interface SyncQueueItem {
  id: string;
  entity: string;
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  data: string;
  timestamp: number;
  retryCount: number;
}

export interface EntityWithSync {
  id: string;
  sync_status: 'synced' | 'pending' | 'conflict';
  local_timestamp: number;
}

/**
 * Servicio SQLite para almacenamiento local offline-first
 * Maneja CRUD local y cola de sincronización
 */
@Injectable({ providedIn: 'root' })
export class SqliteService {
  private db: any = null;
  private readonly DB_NAME = 'cosechapp.db';
  private readonly _isInitialized = signal(false);
  private readonly _dbError = signal<string | null>(null);

  readonly isInitialized = this._isInitialized.asReadonly();
  readonly dbError = this._dbError.asReadonly();

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    if (this._isInitialized()) return;

    try {
      // En web (tests), SQLite no está disponible nativamente
      if (Capacitor.getPlatform() === 'web') {
        console.warn('SQLite no disponible en web - usando fallback en memoria');
        this._isInitialized.set(true);
        return;
      }

      // Crear conexión usando CapacitorSQLite
      this.db = await CapacitorSQLite.createConnection({
        database: this.DB_NAME,
        encrypted: false,
        mode: 'no-encryption',
        version: 1,
        readonly: false,
      });

      await this.db.open();

      // Crear esquema
      await this.db.execute(SQLITE_SCHEMA);

      this._isInitialized.set(true);
      console.log('SQLite inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando SQLite:', error);
      this._dbError.set(error instanceof Error ? error.message : 'Error desconocido');
      this._isInitialized.set(false);
    }
  }

  // ============ Helpers genéricos ============

  private async ensureInitialized(): Promise<void> {
    if (!this._isInitialized()) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private getTimestamp(): number {
    return Date.now();
  }

  // ============ CRUD genérico ============

  async create<T extends EntityWithSync>(table: string, data: Omit<T, 'id' | 'sync_status' | 'local_timestamp'>): Promise<T> {
    await this.ensureInitialized();

    const id = this.generateId();
    const timestamp = this.getTimestamp();
    const newData = {
      ...data,
      id,
      sync_status: 'pending',
      local_timestamp: timestamp,
    } as any;

    const columns = Object.keys(newData).join(', ');
    const placeholders = Object.keys(newData).map(() => '?').join(', ');
    const values = Object.values(newData);

    await this.db.run(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values);
    return newData;
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    await this.ensureInitialized();
    const result = await this.db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return result.values?.[0] as T ?? null;
  }

  async getAll<T>(table: string): Promise<T[]> {
    await this.ensureInitialized();
    const result = await this.db.query(`SELECT * FROM ${table} ORDER BY local_timestamp DESC`);
    return (result.values ?? []) as T[];
  }

  async update<T extends EntityWithSync>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    await this.ensureInitialized();

    const timestamp = this.getTimestamp();
    const updates = { ...data, sync_status: 'pending', local_timestamp: timestamp };
    const columns = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    const changes = await this.db.run(`UPDATE ${table} SET ${columns} WHERE id = ?`, values);
    if (changes.changes === 0) return null;

    return this.getById<T>(table, id);
  }

  async delete(table: string, id: string): Promise<boolean> {
    await this.ensureInitialized();
    const changes = await this.db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return (changes.changes ?? 0) > 0;
  }

  // ============ Cola de sincronización ============

  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void> {
    await this.ensureInitialized();
    const id = this.generateId();
    await this.db.run(
      `INSERT INTO sync_queue (id, entity, operation, entity_id, data, timestamp, retry_count) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, item.entity, item.operation, item.entityId, item.data, item.timestamp, item.retryCount ?? 0]
    );
  }

  async getPendingSyncItems(limit = 50): Promise<SyncQueueItem[]> {
    await this.ensureInitialized();
    const result = await this.db.query(
      `SELECT * FROM sync_queue ORDER BY timestamp ASC LIMIT ?`,
      [limit]
    );
    return (result.values ?? []) as SyncQueueItem[];
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.db.run(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  }

  async incrementRetryCount(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.db.run(`UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?`, [id]);
  }

  async clearSyncedQueue(): Promise<void> {
    await this.ensureInitialized();
    await this.db.run(`DELETE FROM sync_queue WHERE retry_count > 5`);
  }

  // ============ Consultas específicas ============

  async getPendingEntities(table: string): Promise<EntityWithSync[]> {
    await this.ensureInitialized();
    const result = await this.db.query(
      `SELECT id, sync_status, local_timestamp FROM ${table} WHERE sync_status = 'pending' ORDER BY local_timestamp ASC`
    );
    return (result.values ?? []) as EntityWithSync[];
  }

  async markSynced(table: string, id: string): Promise<void> {
    await this.ensureInitialized();
    await this.db.run(
      `UPDATE ${table} SET sync_status = 'synced' WHERE id = ?`,
      [id]
    );
  }

  async markConflict(table: string, id: string): Promise<void> {
    await this.ensureInitialized();
    await this.db.run(
      `UPDATE ${table} SET sync_status = 'conflict' WHERE id = ?`,
      [id]
    );
  }

  async getPendingSyncCount(): Promise<number> {
    await this.ensureInitialized();
    const result = await this.db.query(`SELECT COUNT(*) as count FROM sync_queue`);
    return result.values?.[0]?.count ?? 0;
  }

  // ============ Transacciones ============

  async transaction(callback: (db: any) => Promise<void>): Promise<void> {
    await this.ensureInitialized();
    await this.db.run('BEGIN TRANSACTION');
    try {
      await callback(this.db);
      await this.db.run('COMMIT');
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }
}