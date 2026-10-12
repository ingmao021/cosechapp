import { Harvest } from './harvest.entity';
import { HarvestStatus } from './harvest-status.enum';
import { Payment } from '@domain/payment/payment.entity';

export interface HarvestRepository {
  save(harvest: Harvest): Promise<Harvest>;
  findById(id: string): Promise<Harvest | null>;
  findActiveByFarmId(farmId: string): Promise<Harvest | null>;
  findAllByFarmId(farmId: string): Promise<Harvest[]>;
  findByIdAndFarmId(id: string, farmId: string): Promise<Harvest | null>;
  findAllByFarmIdWithStatus(farmId: string, status: HarvestStatus): Promise<Harvest[]>;
  /** Pesadas y pagos registrados en la cosecha (de todos sus recolectores). */
  countRecords(harvestId: string): Promise<{ weighings: number; payments: number }>;
  /** Borra la cosecha con sus cuadrillas y recolectores (solo si no tiene registros). */
  delete(id: string): Promise<void>;
  /** Guarda la cosecha cerrada junto con los pagos de liquidación, en una sola transacción. */
  closeWithSettlements(harvest: Harvest, payments: Payment[]): Promise<Harvest>;
}