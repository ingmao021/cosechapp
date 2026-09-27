import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { HarvestAlreadyActiveError } from '@shared/errors/domain-errors';
import { FarmRepository } from '@domain/farm/farm.repository';

export interface OpenHarvestUseCaseInput {
  farmId: string;
  name: string;
  pricePerKilogram: number;
}

export interface OpenHarvestUseCaseOutput {
  harvest: Harvest;
}

export class OpenHarvestUseCase {
  constructor(
    private readonly harvestRepository: HarvestRepository,
    private readonly farmRepository: FarmRepository,
  ) {}

  async execute(input: OpenHarvestUseCaseInput): Promise<OpenHarvestUseCaseOutput> {
    const farm = await this.farmRepository.findById(input.farmId);
    if (!farm) {
      throw new Error('Farm not found');
    }

    const activeHarvest = await this.harvestRepository.findActiveByFarmId(input.farmId);
    if (activeHarvest) {
      throw new HarvestAlreadyActiveError();
    }

    const harvest = Harvest.create(
      crypto.randomUUID(),
      input.farmId,
      input.name,
      input.pricePerKilogram,
    );

    const saved = await this.harvestRepository.save(harvest);

    return { harvest: saved };
  }
}