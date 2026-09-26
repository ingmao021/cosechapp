import { WorkerRepository } from '@domain/worker/worker.repository';
import { WorkerNotFoundError } from '@shared/errors/domain-errors';

export interface DeleteWorkerUseCaseInput {
  workerId: string;
  coffeeGrowerId: string;
}

export class DeleteWorkerUseCase {
  constructor(private readonly workerRepository: WorkerRepository) {}

  async execute(input: DeleteWorkerUseCaseInput): Promise<void> {
    const worker = await this.workerRepository.findByIdAndCoffeeGrowerId(
      input.workerId,
      input.coffeeGrowerId,
    );
    if (!worker) {
      throw new WorkerNotFoundError(input.workerId);
    }

    await this.workerRepository.delete(input.workerId);
  }
}