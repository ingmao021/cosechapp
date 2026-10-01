import { HarvestWorker } from '../harvest-worker.entity';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { HarvestRepository } from '../harvest.repository';
import { CrewRepository } from '../crew.repository';
import { WorkerRepository } from '@domain/worker/worker.repository';
import {
  HarvestNotActiveError,
  BusinessRuleViolationError,
  ResourceNotFoundError,
  CrewNotFoundError,
} from '@shared/errors/domain-errors';

export interface AssignWorkerToHarvestUseCaseInput {
  harvestId: string;
  workerId: string;
  harvestAlias?: string;
  /** Cuadrilla de la misma cosecha. Si el trabajador ya está en la cosecha, se le mueve a esta cuadrilla. */
  crewId?: string;
}

export interface AssignWorkerToHarvestUseCaseOutput {
  harvestWorker: HarvestWorker;
  /** false cuando el trabajador ya estaba en la cosecha y solo se movió de cuadrilla. */
  created: boolean;
}

export class AssignWorkerToHarvestUseCase {
  constructor(
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly workerRepository: WorkerRepository,
    private readonly crewRepository: CrewRepository,
  ) {}

  async execute(input: AssignWorkerToHarvestUseCaseInput): Promise<AssignWorkerToHarvestUseCaseOutput> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new HarvestNotActiveError();
    }
    if (!harvest.isActive()) {
      throw new BusinessRuleViolationError('Cannot assign workers to a closed harvest');
    }

    const worker = await this.workerRepository.findById(input.workerId);
    if (!worker) {
      throw new ResourceNotFoundError('Worker not found');
    }

    if (input.crewId) {
      const crew = await this.crewRepository.findByIdAndHarvestId(input.crewId, input.harvestId);
      if (!crew) {
        throw new CrewNotFoundError(input.crewId);
      }
    }

    const existing = await this.harvestWorkerRepository.findByHarvestIdAndWorkerId(
      input.harvestId,
      input.workerId,
    );
    if (existing) {
      if (!input.crewId) {
        throw new BusinessRuleViolationError('Worker is already assigned to this harvest');
      }
      const moved = await this.harvestWorkerRepository.save(existing.assignToCrew(input.crewId));
      return { harvestWorker: moved, created: false };
    }

    const harvestWorker = HarvestWorker.create(
      crypto.randomUUID(),
      input.harvestId,
      input.workerId,
      input.harvestAlias ?? null,
      input.crewId ?? null,
    );

    const saved = await this.harvestWorkerRepository.save(harvestWorker);
    return { harvestWorker: saved, created: true };
  }
}
