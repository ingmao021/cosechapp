import { HarvestWorker } from '../harvest-worker.entity';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { HarvestRepository } from '../harvest.repository';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { HarvestNotActiveError } from '@shared/errors/domain-errors';

export interface AssignWorkerToHarvestUseCaseInput {
  harvestId: string;
  workerId: string;
  harvestAlias?: string;
}

export interface AssignWorkerToHarvestUseCaseOutput {
  harvestWorker: HarvestWorker;
}

export class AssignWorkerToHarvestUseCase {
  constructor(
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly workerRepository: WorkerRepository,
  ) {}

  async execute(input: AssignWorkerToHarvestUseCaseInput): Promise<AssignWorkerToHarvestUseCaseOutput> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new HarvestNotActiveError();
    }
    if (!harvest.isActive()) {
      throw new Error('Cannot assign workers to a closed harvest');
    }

    const worker = await this.workerRepository.findById(input.workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    const existing = await this.harvestWorkerRepository.findByHarvestIdAndWorkerId(
      input.harvestId,
      input.workerId,
    );
    if (existing) {
      throw new Error('Worker is already assigned to this harvest');
    }

    const harvestWorker = HarvestWorker.create(
      crypto.randomUUID(),
      input.harvestId,
      input.workerId,
      input.harvestAlias ?? null,
    );

    const saved = await this.harvestWorkerRepository.save(harvestWorker);
    return { harvestWorker: saved };
  }
}