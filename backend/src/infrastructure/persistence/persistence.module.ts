import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaHarvestQueries } from './prisma-harvest-queries';
import { PrismaCoffeeGrowerRepository } from './prisma-coffee-grower.repository';
import { PrismaFarmRepository } from './prisma-farm.repository';
import { PrismaHarvestRepository } from './prisma-harvest.repository';
import { PrismaWorkerRepository } from './prisma-worker.repository';
import { PrismaHarvestWorkerRepository } from './prisma-harvest-worker.repository';
import { PrismaCrewRepository } from './prisma-crew.repository';
import { PrismaWeighingRepository } from './prisma-weighing.repository';
import { PrismaPaymentRepository } from './prisma-payment.repository';
import { PrismaSaleRepository } from './prisma-sale.repository';
import { PrismaProductionCostRepository } from './prisma-production-cost.repository';
import { PrismaCoffeePriceRepository } from './prisma-coffee-price.repository';
import { PrismaNotificationRepository } from './prisma-notification.repository';

@Module({
  providers: [
    PrismaService,
    PrismaHarvestQueries,
    {
      provide: 'COFFEE_GROWER_REPOSITORY',
      useClass: PrismaCoffeeGrowerRepository,
    },
    {
      provide: 'FARM_REPOSITORY',
      useClass: PrismaFarmRepository,
    },
    {
      provide: 'HARVEST_REPOSITORY',
      useClass: PrismaHarvestRepository,
    },
    {
      provide: 'WORKER_REPOSITORY',
      useClass: PrismaWorkerRepository,
    },
    {
      provide: 'HARVEST_WORKER_REPOSITORY',
      useClass: PrismaHarvestWorkerRepository,
    },
    {
      provide: 'CREW_REPOSITORY',
      useClass: PrismaCrewRepository,
    },
    {
      provide: 'WEIGHING_REPOSITORY',
      useClass: PrismaWeighingRepository,
    },
    {
      provide: 'PAYMENT_REPOSITORY',
      useClass: PrismaPaymentRepository,
    },
    {
      provide: 'SALE_REPOSITORY',
      useClass: PrismaSaleRepository,
    },
    {
      provide: 'PRODUCTION_COST_REPOSITORY',
      useClass: PrismaProductionCostRepository,
    },
    {
      provide: 'COFFEE_PRICE_REPOSITORY',
      useClass: PrismaCoffeePriceRepository,
    },
    {
      provide: 'NOTIFICATION_REPOSITORY',
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [
    'COFFEE_GROWER_REPOSITORY',
    'FARM_REPOSITORY',
    'HARVEST_REPOSITORY',
    'WORKER_REPOSITORY',
    'HARVEST_WORKER_REPOSITORY',
    'CREW_REPOSITORY',
    'WEIGHING_REPOSITORY',
    'PAYMENT_REPOSITORY',
    'SALE_REPOSITORY',
    'PRODUCTION_COST_REPOSITORY',
    'COFFEE_PRICE_REPOSITORY',
    'NOTIFICATION_REPOSITORY',
    PrismaService,
    PrismaHarvestQueries,
  ],
})
export class PersistenceModule {}