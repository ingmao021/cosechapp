import { Crew } from '../crew.entity';
import { CrewRepository } from '../crew.repository';
import { CrewNotFoundError } from '@shared/errors/domain-errors';

export interface UpdateCrewUseCaseInput {
  crewId: string;
  harvestId: string;
  name: string;
}

export interface UpdateCrewUseCaseOutput {
  crew: Crew;
}

export class UpdateCrewUseCase {
  constructor(private readonly crewRepository: CrewRepository) {}

  async execute(input: UpdateCrewUseCaseInput): Promise<UpdateCrewUseCaseOutput> {
    const crew = await this.crewRepository.findByIdAndHarvestId(
      input.crewId,
      input.harvestId,
    );
    if (!crew) {
      throw new CrewNotFoundError(input.crewId);
    }

    const updated = crew.updateName(input.name);
    const saved = await this.crewRepository.save(updated);
    return { crew: saved };
  }
}