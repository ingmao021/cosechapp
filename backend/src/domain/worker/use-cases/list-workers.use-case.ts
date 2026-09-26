import { CatalogWorker } from '@domain/worker/worker.entity';
import { WorkerRepository } from '@domain/worker/worker.repository';

export interface ListWorkersUseCaseInput {
  coffeeGrowerId: string;
}

export interface ListWorkersUseCaseOutput {
  workers: CatalogWorker[];
}

export class ListWorkersUseCase {
  constructor(private readonly workerRepository: WorkerRepository) {}

  async execute(input: ListWorkersUseCaseInput): Promise<ListWorkersUseCaseOutput> {
    const workers = await this.workerRepository.findAllByCoffeeGrowerId(input.coffeeGrowerId);
    return { workers };
  }
}