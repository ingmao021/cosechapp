import { Module } from '@nestjs/common';
import { useCaseProvider } from '@infrastructure/http/use-case.provider';
import { WeighingController } from './weighing.controller';
import { WeighingService } from './weighing.service';
import { RecordWeighingUseCase } from '@domain/weighing/use-cases/record-weighing.use-case';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { OwnershipModule } from '@infrastructure/http/ownership.module';

@Module({
  imports: [PersistenceModule, OwnershipModule],
  controllers: [WeighingController],
  providers: [
    WeighingService,
    useCaseProvider(RecordWeighingUseCase, ['WEIGHING_REPOSITORY', 'HARVEST_WORKER_REPOSITORY', 'HARVEST_REPOSITORY']),
  ],
  exports: [WeighingService],
})
export class WeighingModule {}