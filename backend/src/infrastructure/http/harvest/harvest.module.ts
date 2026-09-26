import { Module } from '@nestjs/common';
import { HarvestController } from './harvest.controller';
import { HarvestService } from './harvest.service';
import { OpenHarvestUseCase } from '@domain/harvest/use-cases/open-harvest.use-case';
import { CloseHarvestUseCase } from '@domain/harvest/use-cases/close-harvest.use-case';
import { AssignWorkerToHarvestUseCase } from '@domain/harvest/use-cases/assign-worker.use-case';
import { ArchiveWorkerUseCase } from '@domain/harvest/use-cases/archive-worker.use-case';
import { CreateCrewUseCase } from '@domain/harvest/use-cases/create-crew.use-case';
import { GetCrewUseCase } from '@domain/harvest/use-cases/get-crew.use-case';
import { ListCrewsUseCase } from '@domain/harvest/use-cases/list-crews.use-case';
import { UpdateCrewUseCase } from '@domain/harvest/use-cases/update-crew.use-case';
import { DeleteCrewUseCase } from '@domain/harvest/use-cases/delete-crew.use-case';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [HarvestController],
  providers: [
    HarvestService,
    OpenHarvestUseCase,
    CloseHarvestUseCase,
    AssignWorkerToHarvestUseCase,
    ArchiveWorkerUseCase,
    CreateCrewUseCase,
    GetCrewUseCase,
    ListCrewsUseCase,
    UpdateCrewUseCase,
    DeleteCrewUseCase,
  ],
  exports: [HarvestService],
})
export class HarvestModule {}