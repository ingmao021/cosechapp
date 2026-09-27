import { CatalogWorker } from '@domain/worker/worker.entity';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { WorkerNotFoundError } from '@shared/errors/domain-errors';

export interface GetWorkerUseCaseInput {
  workerId: string;
  coffeeGrowerId: string;
}

export interface GetWorkerUseCaseOutput {
  worker: CatalogWorker;
}

export class GetWorkerUseCase {
  constructor(private readonly workerRepository: WorkerRepository) {}

  async execute(input: GetWorkerUseCaseInput): Promise<GetWorkerUseCaseOutput> {
    const worker = await this.workerRepository.findByIdAndCoffeeGrowerId(
      input.workerId,
      input.coffeeGrowerId,
    );
    if (!worker) {
      throw new WorkerNotFoundError(input.workerId);
    }
    return { worker };
  }
}