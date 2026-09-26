import { Module } from '@nestjs/common';
import { HarvestController } from './harvest.controller';
import { HarvestService } from './harvest.service';
import { OpenHarvestUseCase } from '@domain/harvest/use-cases/open-harvest.use-case';
import { CloseHarvestUseCase } from '@domain/harvest/use-cases/close-harvest.use-case';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [HarvestController],
  providers: [
    HarvestService,
    OpenHarvestUseCase,
    CloseHarvestUseCase,
  ],
  exports: [HarvestService],
})
export class HarvestModule {}