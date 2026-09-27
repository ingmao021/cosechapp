import { Crew } from '../crew.entity';
import { CrewRepository } from '../crew.repository';

export interface ListCrewsUseCaseInput {
  harvestId: string;
}

export interface ListCrewsUseCaseOutput {
  crews: Crew[];
}

export class ListCrewsUseCase {
  constructor(private readonly crewRepository: CrewRepository) {}

  async execute(input: ListCrewsUseCaseInput): Promise<ListCrewsUseCaseOutput> {
    const crews = await this.crewRepository.findAllByHarvestId(input.harvestId);
    return { crews };
  }
}