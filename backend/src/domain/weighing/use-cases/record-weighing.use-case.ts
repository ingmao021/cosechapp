import { Weighing } from '../weighing.entity';
import { WeighingRepository } from '../weighing.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { HarvestPickerStatus } from '@domain/harvest/harvest-picker-status.enum';
import { InvalidKilogramsError } from '@shared/errors/domain-errors';

export interface RecordWeighingUseCaseInput {
  harvestPickerId: string;
  kilograms: number;
  dateTime?: Date;
}

export interface RecordWeighingUseCaseOutput {
  weighing: Weighing;
}

export class RecordWeighingUseCase {
  constructor(
    private readonly weighingRepository: WeighingRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
  ) {}

  async execute(input: RecordWeighingUseCaseInput): Promise<RecordWeighingUseCaseOutput> {
    if (input.kilograms <= 0) {
      throw new InvalidKilogramsError();
    }

    const harvestWorker = await this.harvestWorkerRepository.findById(input.harvestPickerId);
    if (!harvestWorker) {
      throw new Error('Harvest picker not found');
    }

    if (!harvestWorker.isActive()) {
      throw new Error('Cannot record weighing for archived picker');
    }

    const weighing = Weighing.create(
      crypto.randomUUID(),
      input.harvestPickerId,
      input.kilograms,
      input.dateTime ?? new Date(),
    );

    const saved = await this.weighingRepository.save(weighing);
    return { weighing: saved };
  }
}