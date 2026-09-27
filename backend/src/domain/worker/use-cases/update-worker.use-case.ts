import { CatalogWorker } from '@domain/worker/worker.entity';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { WorkerNotFoundError } from '@shared/errors/domain-errors';

export interface UpdateWorkerUseCaseInput {
  workerId: string;
  coffeeGrowerId: string;
  firstName: string;
  lastName: string;
  alias?: string;
  phoneNumber?: string;
}

export interface UpdateWorkerUseCaseOutput {
  worker: CatalogWorker;
}

export class UpdateWorkerUseCase {
  constructor(private readonly workerRepository: WorkerRepository) {}

  async execute(input: UpdateWorkerUseCaseInput): Promise<UpdateWorkerUseCaseOutput> {
    const worker = await this.workerRepository.findByIdAndCoffeeGrowerId(
      input.workerId,
      input.coffeeGrowerId,
    );
    if (!worker) {
      throw new WorkerNotFoundError(input.workerId);
    }

    const updated = worker.updateDetails(
      input.firstName,
      input.lastName,
      input.alias ?? null,
      input.phoneNumber ?? null,
    );

    const saved = await this.workerRepository.save(updated);
    return { worker: saved };
  }
}