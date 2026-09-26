import { Injectable } from '@nestjs/common';
import { Weighing } from '@domain/weighing/weighing.entity';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { RecordWeighingUseCase } from '@domain/weighing/use-cases/record-weighing.use-case';

@Injectable()
export class WeighingService {
  constructor(
    private readonly weighingRepository: WeighingRepository,
    private readonly recordWeighingUseCase: RecordWeighingUseCase,
  ) {}

  async recordWeighing(input: { harvestPickerId: string; kilograms: number; dateTime?: Date }): Promise<Weighing> {
    const result = await this.recordWeighingUseCase.execute(input);
    return result.weighing;
  }

  async getWeighingsByPicker(harvestPickerId: string): Promise<Weighing[]> {
    return this.weighingRepository.findAllByHarvestPickerId(harvestPickerId);
  }

  async getWeighingsByPickerAndDateRange(
    harvestPickerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Weighing[]> {
    return this.weighingRepository.findByHarvestPickerIdAndDateRange(harvestPickerId, startDate, endDate);
  }

  async getTotalKilogramsByPicker(harvestPickerId: string): Promise<number> {
    return this.weighingRepository.getTotalKilogramsByHarvestPickerId(harvestPickerId);
  }

  async getTotalKilogramsByPickerAndDateRange(
    harvestPickerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.weighingRepository.getTotalKilogramsByHarvestPickerIdAndDateRange(harvestPickerId, startDate, endDate);
  }
}