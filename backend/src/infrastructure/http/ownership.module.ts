import { Module } from '@nestjs/common';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { OwnershipService } from './ownership.service';

@Module({
  imports: [PersistenceModule],
  providers: [OwnershipService],
  exports: [OwnershipService],
})
export class OwnershipModule {}
