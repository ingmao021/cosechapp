import { Harvest } from './harvest.entity';
import { HarvestStatus } from './harvest-status.enum';

export interface HarvestRepository {
  save(harvest: Harvest): Promise<Harvest>;
  findById(id: string): Promise<Harvest | null>;
  findActiveByFarmId(farmId: string): Promise<Harvest | null>;
  findAllByFarmId(farmId: string): Promise<Harvest[]>;
  findByIdAndFarmId(id: string, farmId: string): Promise<Harvest | null>;
  findAllByFarmIdWithStatus(farmId: string, status: HarvestStatus): Promise<Harvest[]>;
}