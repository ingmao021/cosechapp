import { HarvestWorker } from './harvest-worker.entity';
import { HarvestPickerStatus } from './harvest-picker-status.enum';

export interface HarvestWorkerRepository {
  save(harvestWorker: HarvestWorker): Promise<HarvestWorker>;
  findById(id: string): Promise<HarvestWorker | null>;
  findByHarvestIdAndWorkerId(harvestId: string, workerId: string): Promise<HarvestWorker | null>;
  findAllByHarvestId(harvestId: string): Promise<HarvestWorker[]>;
  findAllByHarvestIdAndStatus(harvestId: string, status: HarvestPickerStatus): Promise<HarvestWorker[]>;
  findByIdAndHarvestId(id: string, harvestId: string): Promise<HarvestWorker | null>;
}