import { CatalogWorker } from '@domain/worker/worker.entity';
import { WorkerRepository } from '@domain/worker/worker.repository';

export interface CreateWorkerUseCaseInput {
  coffeeGrowerId: string;
  firstName: string;
  lastName: string;
  alias?: string;
  phoneNumber?: string;
}

export interface CreateWorkerUseCaseOutput {
  worker: CatalogWorker;
}

export class CreateWorkerUseCase {
  constructor(private readonly workerRepository: WorkerRepository) {}

  async execute(input: CreateWorkerUseCaseInput): Promise<CreateWorkerUseCaseOutput> {
    const worker = CatalogWorker.create(
      crypto.randomUUID(),
      input.coffeeGrowerId,
      input.firstName,
      input.lastName,
      input.alias ?? null,
      input.phoneNumber ?? null,
    );

    const saved = await this.workerRepository.save(worker);
    return { worker: saved };
  }
}