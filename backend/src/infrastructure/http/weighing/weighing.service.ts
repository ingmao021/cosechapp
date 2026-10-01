import { Injectable, Inject } from '@nestjs/common';
import { Weighing } from '@domain/weighing/weighing.entity';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import {
  RecordWeighingUseCase,
  RecordWeighingUseCaseInput,
  RecordWeighingUseCaseOutput,
} from '@domain/weighing/use-cases/record-weighing.use-case';
import { OwnershipService } from '@infrastructure/http/ownership.service';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';

@Injectable()
export class WeighingService {
  constructor(
    @Inject('WEIGHING_REPOSITORY') private readonly weighingRepository: WeighingRepository,
    private readonly recordWeighingUseCase: RecordWeighingUseCase,
    private readonly ownership: OwnershipService,
  ) {}

  async recordWeighing(user: AuthUser, input: RecordWeighingUseCaseInput): Promise<RecordWeighingUseCaseOutput> {
    await this.ownership.pickerFor(input.harvestPickerId, user.farmId);
    return this.recordWeighingUseCase.execute(input);
  }

  async getWeighingsByPicker(user: AuthUser, harvestPickerId: string): Promise<Weighing[]> {
    await this.ownership.pickerFor(harvestPickerId, user.farmId);
    return this.weighingRepository.findAllByHarvestPickerId(harvestPickerId);
  }

  async getWeighingsByPickerAndDateRange(
    user: AuthUser,
    harvestPickerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Weighing[]> {
    await this.ownership.pickerFor(harvestPickerId, user.farmId);
    return this.weighingRepository.findByHarvestPickerIdAndDateRange(harvestPickerId, startDate, endDate);
  }

  async getTotalKilogramsByPicker(user: AuthUser, harvestPickerId: string): Promise<number> {
    await this.ownership.pickerFor(harvestPickerId, user.farmId);
    return this.weighingRepository.getTotalKilogramsByHarvestPickerId(harvestPickerId);
  }

  async getTotalKilogramsByPickerAndDateRange(
    user: AuthUser,
    harvestPickerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    await this.ownership.pickerFor(harvestPickerId, user.farmId);
    return this.weighingRepository.getTotalKilogramsByHarvestPickerIdAndDateRange(harvestPickerId, startDate, endDate);
  }
}
