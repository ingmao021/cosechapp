import { Injectable, Inject } from '@nestjs/common';
import { PrismaHarvestQueries } from '@infrastructure/persistence/prisma-harvest-queries';
import { WorkerHasHarvestHistoryError } from '@shared/errors/domain-errors';
import { CatalogWorker } from '@domain/worker/worker.entity';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { CreateWorkerUseCase } from '@domain/worker/use-cases/create-worker.use-case';
import { GetWorkerUseCase } from '@domain/worker/use-cases/get-worker.use-case';
import { ListWorkersUseCase } from '@domain/worker/use-cases/list-workers.use-case';
import { UpdateWorkerUseCase } from '@domain/worker/use-cases/update-worker.use-case';
import { DeleteWorkerUseCase } from '@domain/worker/use-cases/delete-worker.use-case';

@Injectable()
export class WorkerService {
  constructor(
    @Inject('WORKER_REPOSITORY') private readonly workerRepository: WorkerRepository,
    private readonly createWorkerUseCase: CreateWorkerUseCase,
    private readonly getWorkerUseCase: GetWorkerUseCase,
    private readonly listWorkersUseCase: ListWorkersUseCase,
    private readonly updateWorkerUseCase: UpdateWorkerUseCase,
    private readonly deleteWorkerUseCase: DeleteWorkerUseCase,
    private readonly queries: PrismaHarvestQueries,
  ) {}

  async createWorker(input: { coffeeGrowerId: string; firstName: string; lastName: string; alias?: string; phoneNumber?: string }): Promise<CatalogWorker> {
    const result = await this.createWorkerUseCase.execute(input);
    return result.worker;
  }

  async getWorker(workerId: string, coffeeGrowerId: string): Promise<CatalogWorker> {
    const result = await this.getWorkerUseCase.execute({ workerId, coffeeGrowerId });
    return result.worker;
  }

  async listWorkers(coffeeGrowerId: string): Promise<CatalogWorker[]> {
    const result = await this.listWorkersUseCase.execute({ coffeeGrowerId });
    return result.workers;
  }

  async updateWorker(input: { workerId: string; coffeeGrowerId: string; firstName: string; lastName: string; alias?: string; phoneNumber?: string }): Promise<CatalogWorker> {
    const result = await this.updateWorkerUseCase.execute(input);
    return result.worker;
  }

  async deleteWorker(workerId: string, coffeeGrowerId: string): Promise<void> {
    // El borrado es en cascada en la base de datos: protegemos pesadas y pagos ya registrados.
    if (await this.queries.workerHasHarvestHistory(workerId)) {
      throw new WorkerHasHarvestHistoryError();
    }
    await this.deleteWorkerUseCase.execute({ workerId, coffeeGrowerId });
  }
}