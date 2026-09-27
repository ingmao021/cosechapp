import { CrewRepository } from '../crew.repository';
import { CrewNotFoundError } from '@shared/errors/domain-errors';

export interface DeleteCrewUseCaseInput {
  crewId: string;
  harvestId: string;
}

export class DeleteCrewUseCase {
  constructor(private readonly crewRepository: CrewRepository) {}

  async execute(input: DeleteCrewUseCaseInput): Promise<void> {
    const crew = await this.crewRepository.findByIdAndHarvestId(
      input.crewId,
      input.harvestId,
    );
    if (!crew) {
      throw new CrewNotFoundError(input.crewId);
    }

    await this.crewRepository.delete(input.crewId);
  }
}