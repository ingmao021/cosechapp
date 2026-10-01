import { Weighing } from '../weighing.entity';
import { WeighingRepository } from '../weighing.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import {
  InvalidKilogramsError,
  BusinessRuleViolationError,
  ResourceNotFoundError,
  IdempotencyKeyConflictError,
} from '@shared/errors/domain-errors';

export interface RecordWeighingUseCaseInput {
  /**
   * Id generado en el teléfono. Hace idempotente el registro: una pesada guardada
   * sin señal puede reenviarse varias veces sin duplicarse.
   */
  id?: string;
  harvestPickerId: string;
  kilograms: number;
  dateTime?: Date;
}

export interface RecordWeighingUseCaseOutput {
  weighing: Weighing;
  /** false cuando la pesada ya existía (reenvío de la misma pesada). */
  created: boolean;
}

export class RecordWeighingUseCase {
  constructor(
    private readonly weighingRepository: WeighingRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly harvestRepository: HarvestRepository,
  ) {}

  async execute(input: RecordWeighingUseCaseInput): Promise<RecordWeighingUseCaseOutput> {
    if (input.kilograms <= 0) {
      throw new InvalidKilogramsError();
    }

    if (input.id) {
      const existing = await this.weighingRepository.findById(input.id);
      if (existing) {
        if (existing.harvestPickerId !== input.harvestPickerId || existing.kilograms !== input.kilograms) {
          throw new IdempotencyKeyConflictError();
        }
        return { weighing: existing, created: false };
      }
    }

    const harvestWorker = await this.harvestWorkerRepository.findById(input.harvestPickerId);
    if (!harvestWorker) {
      throw new ResourceNotFoundError('Harvest picker not found');
    }

    if (!harvestWorker.isActive()) {
      throw new BusinessRuleViolationError('Cannot record weighing for archived picker');
    }

    const harvest = await this.harvestRepository.findById(harvestWorker.harvestId);
    if (!harvest?.isActive()) {
      throw new BusinessRuleViolationError('Cannot record weighing in a closed harvest');
    }

    const weighing = Weighing.create(
      input.id ?? crypto.randomUUID(),
      input.harvestPickerId,
      input.kilograms,
      input.dateTime ?? new Date(),
    );

    const saved = await this.weighingRepository.save(weighing);
    return { weighing: saved, created: true };
  }
}
