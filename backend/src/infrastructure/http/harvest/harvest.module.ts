import { Module } from '@nestjs/common';
import { HarvestController } from './harvest.controller';
import { HarvestService } from './harvest.service';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { OwnershipModule } from '@infrastructure/http/ownership.module';

@Module({
  imports: [PersistenceModule, OwnershipModule],
  controllers: [HarvestController],
  // HarvestService arma sus casos de uso con los repositorios inyectados.
  providers: [HarvestService],
  exports: [HarvestService],
})
export class HarvestModule {}
