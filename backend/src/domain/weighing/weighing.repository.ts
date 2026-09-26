import { Weighing } from './weighing.entity';

export interface WeighingRepository {
  save(weighing: Weighing): Promise<Weighing>;
  findById(id: string): Promise<Weighing | null>;
  findAllByHarvestPickerId(harvestPickerId: string): Promise<Weighing[]>;
  findByHarvestPickerIdAndDateRange(
    harvestPickerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Weighing[]>;
  getTotalKilogramsByHarvestPickerId(harvestPickerId: string): Promise<number>;
  getTotalKilogramsByHarvestPickerIdAndDateRange(
    harvestPickerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;
  delete(id: string): Promise<void>;
}