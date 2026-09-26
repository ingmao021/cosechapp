import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaCoffeeGrowerRepository } from './prisma-coffee-grower.repository';
import { PrismaFarmRepository } from './prisma-farm.repository';
import { PrismaHarvestRepository } from './prisma-harvest.repository';
import { PrismaWorkerRepository } from './prisma-worker.repository';

@Module({
  providers: [
    PrismaService,
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
  ],
  exports: [
    'COFFEE_GROWER_REPOSITORY',
    'FARM_REPOSITORY',
    'HARVEST_REPOSITORY',
    'WORKER_REPOSITORY',
    PrismaService,
  ],
})
export class PersistenceModule {}