import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './infrastructure/http/auth/auth.module';
import { HarvestModule } from './infrastructure/http/harvest/harvest.module';
import { WorkerModule } from './infrastructure/http/worker/worker.module';
import { WeighingModule } from './infrastructure/http/weighing/weighing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    HarvestModule,
    WorkerModule,
    WeighingModule,
  ],
})
export class AppModule {}