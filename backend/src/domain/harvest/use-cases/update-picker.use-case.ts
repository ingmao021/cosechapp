import { HarvestWorker } from '../harvest-worker.entity';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { CrewRepository } from '../crew.repository';
import { CrewNotFoundError, PickerNotFoundError } from '@shared/errors/domain-errors';

export interface UpdatePickerUseCaseInput {
  harvestId: string;
  pickerId: string;
  /** Cuadrilla de la misma cosecha, null para dejarlo sin cuadrilla; sin enviar, no cambia. */
  crewId?: string | null;
  /** Nombre solo para esta cosecha; null lo quita (se ve el del catálogo); sin enviar, no cambia. */
  harvestAlias?: string | null;
}

/** Cambia de cuadrilla a un recolector (o lo deja trabajando solo) y/o su nombre en la cosecha. */
export class UpdatePickerUseCase {
  constructor(
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly crewRepository: CrewRepository,
  ) {}

  async execute(input: UpdatePickerUseCaseInput): Promise<{ harvestWorker: HarvestWorker }> {
    let picker = await this.harvestWorkerRepository.findByIdAndHarvestId(input.pickerId, input.harvestId);
    if (!picker) throw new PickerNotFoundError(input.pickerId);

    if (input.crewId === null) {
      picker = picker.removeFromCrew();
    } else if (input.crewId !== undefined) {
      const crew = await this.crewRepository.findByIdAndHarvestId(input.crewId, input.harvestId);
      if (!crew) throw new CrewNotFoundError(input.crewId);
      picker = picker.assignToCrew(crew.id);
    }
    if (input.harvestAlias !== undefined) {
      picker = picker.updateAlias(input.harvestAlias?.trim() || null);
    }
    return { harvestWorker: await this.harvestWorkerRepository.save(picker) };
  }
}
