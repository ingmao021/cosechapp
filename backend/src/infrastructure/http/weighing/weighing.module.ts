import { Module } from '@nestjs/common';
import { WeighingController } from './weighing.controller';
import { WeighingService } from './weighing.service';
import { RecordWeighingUseCase } from '@domain/weighing/use-cases/record-weighing.use-case';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [WeighingController],
  providers: [WeighingService, RecordWeighingUseCase],
  exports: [WeighingService],
})
export class WeighingModule {}