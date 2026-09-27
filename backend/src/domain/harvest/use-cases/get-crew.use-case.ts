import { Crew } from '../crew.entity';
import { CrewRepository } from '../crew.repository';
import { CrewNotFoundError } from '@shared/errors/domain-errors';

export interface GetCrewUseCaseInput {
  crewId: string;
  harvestId: string;
}

export interface GetCrewUseCaseOutput {
  crew: Crew;
}

export class GetCrewUseCase {
  constructor(private readonly crewRepository: CrewRepository) {}

  async execute(input: GetCrewUseCaseInput): Promise<GetCrewUseCaseOutput> {
    const crew = await this.crewRepository.findByIdAndHarvestId(
      input.crewId,
      input.harvestId,
    );
    if (!crew) {
      throw new CrewNotFoundError(input.crewId);
    }
    return { crew };
  }
}