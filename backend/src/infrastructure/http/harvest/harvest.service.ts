import { Injectable } from '@nestjs/common';
import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { OpenHarvestUseCase } from '@domain/harvest/use-cases/open-harvest.use-case';
import { CloseHarvestUseCase } from '@domain/harvest/use-cases/close-harvest.use-case';
import { FarmRepository } from '@domain/farm/farm.repository';

@Injectable()
export class HarvestService {
  constructor(
    private readonly harvestRepository: HarvestRepository,
    private readonly farmRepository: FarmRepository,
  ) {}

  async openHarvest(input: { farmId: string; name: string; pricePerKilogram: number }): Promise<Harvest> {
    const useCase = new OpenHarvestUseCase(this.harvestRepository, this.farmRepository);
    const result = await useCase.execute(input);
    return result.harvest;
  }

  async closeHarvest(input: { harvestId: string; farmId: string }): Promise<Harvest> {
    const useCase = new CloseHarvestUseCase(this.harvestRepository);
    const result = await useCase.execute(input);
    return result.harvest;
  }

  async findActiveByFarmId(farmId: string): Promise<Harvest | null> {
    return this.harvestRepository.findActiveByFarmId(farmId);
  }

  async findAllByFarmId(farmId: string): Promise<Harvest[]> {
    return this.harvestRepository.findAllByFarmId(farmId);
  }

  async findByIdAndFarmId(id: string, farmId: string): Promise<Harvest | null> {
    return this.harvestRepository.findByIdAndFarmId(id, farmId);
  }
}