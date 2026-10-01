import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { WeighingModule } from '@infrastructure/http/weighing/weighing.module';

@Module({
  imports: [WeighingModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
