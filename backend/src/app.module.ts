import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './infrastructure/http/auth/auth.module';
import { HarvestModule } from './infrastructure/http/harvest/harvest.module';
import { WorkerModule } from './infrastructure/http/worker/worker.module';
import { WeighingModule } from './infrastructure/http/weighing/weighing.module';
import { PaymentModule } from './infrastructure/http/payment/payment.module';
import { SaleAndCostsModule } from './infrastructure/http/sale-and-costs/sale-and-costs.module';
import { PriceAndNewsModule } from './infrastructure/http/price-and-news/price-and-news.module';

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
    PaymentModule,
    SaleAndCostsModule,
    PriceAndNewsModule,
  ],
})
export class AppModule {}