import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { HarvestNotActiveError, HarvestAlreadyClosedError } from '@shared/errors/domain-errors';

export interface CloseHarvestUseCaseInput {
  harvestId: string;
  farmId: string;
}

export interface CloseHarvestUseCaseOutput {
  harvest: Harvest;
}

export class CloseHarvestUseCase {
  constructor(private readonly harvestRepository: HarvestRepository) {}

  async execute(input: CloseHarvestUseCaseInput): Promise<CloseHarvestUseCaseOutput> {
    const harvest = await this.harvestRepository.findByIdAndFarmId(input.harvestId, input.farmId);
    if (!harvest) {
      throw new HarvestNotActiveError();
    }

    if (!harvest.isActive()) {
      throw new HarvestAlreadyClosedError();
    }

    const closedHarvest = harvest.close();
    const saved = await this.harvestRepository.save(closedHarvest);

    return { harvest: saved };
  }
}