import { useCaseProvider } from '@infrastructure/http/use-case.provider';
import { Module } from '@nestjs/common';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { CreateWorkerUseCase } from '@domain/worker/use-cases/create-worker.use-case';
import { GetWorkerUseCase } from '@domain/worker/use-cases/get-worker.use-case';
import { ListWorkersUseCase } from '@domain/worker/use-cases/list-workers.use-case';
import { UpdateWorkerUseCase } from '@domain/worker/use-cases/update-worker.use-case';
import { DeleteWorkerUseCase } from '@domain/worker/use-cases/delete-worker.use-case';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [WorkerController],
  providers: [
    WorkerService,
    useCaseProvider(CreateWorkerUseCase, ['WORKER_REPOSITORY']),
    useCaseProvider(GetWorkerUseCase, ['WORKER_REPOSITORY']),
    useCaseProvider(ListWorkersUseCase, ['WORKER_REPOSITORY']),
    useCaseProvider(UpdateWorkerUseCase, ['WORKER_REPOSITORY']),
    useCaseProvider(DeleteWorkerUseCase, ['WORKER_REPOSITORY']),
  ],
  exports: [WorkerService],
})
export class WorkerModule {}