import { HarvestWorker } from '../harvest-worker.entity';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { HarvestRepository } from '../harvest.repository';
import { HarvestNotActiveError, BusinessRuleViolationError, ResourceNotFoundError } from '@shared/errors/domain-errors';

export interface ArchiveWorkerUseCaseInput {
  harvestWorkerId: string;
  harvestId: string;
}

export interface ArchiveWorkerUseCaseOutput {
  harvestWorker: HarvestWorker;
}

export class ArchiveWorkerUseCase {
  constructor(
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly harvestRepository: HarvestRepository,
  ) {}

  async execute(input: ArchiveWorkerUseCaseInput): Promise<ArchiveWorkerUseCaseOutput> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new HarvestNotActiveError();
    }

    const harvestWorker = await this.harvestWorkerRepository.findByIdAndHarvestId(
      input.harvestWorkerId,
      input.harvestId,
    );
    if (!harvestWorker) {
      throw new ResourceNotFoundError('Harvest worker not found');
    }

    if (!harvestWorker.isActive()) {
      throw new BusinessRuleViolationError('Harvest worker is already archived');
    }

    const archived = harvestWorker.archive();
    const saved = await this.harvestWorkerRepository.save(archived);

    return { harvestWorker: saved };
  }
}