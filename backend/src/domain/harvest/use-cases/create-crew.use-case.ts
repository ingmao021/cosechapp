import { Crew } from '../crew.entity';
import { CrewRepository } from '../crew.repository';
import { HarvestRepository } from '../harvest.repository';
import { HarvestNotActiveError } from '@shared/errors/domain-errors';
import { HarvestStatus } from '../harvest-status.enum';

export interface CreateCrewUseCaseInput {
  harvestId: string;
  name: string;
}

export interface CreateCrewUseCaseOutput {
  crew: Crew;
}

export class CreateCrewUseCase {
  constructor(
    private readonly crewRepository: CrewRepository,
    private readonly harvestRepository: HarvestRepository,
  ) {}

  async execute(input: CreateCrewUseCaseInput): Promise<CreateCrewUseCaseOutput> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new HarvestNotActiveError();
    }
    if (!harvest.isActive()) {
      throw new Error('Cannot create crews in a closed harvest');
    }

    const crew = Crew.create(
      crypto.randomUUID(),
      input.harvestId,
      input.name,
    );

    const saved = await this.crewRepository.save(crew);
    return { crew: saved };
  }
}