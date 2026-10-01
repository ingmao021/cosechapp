import { useCaseProvider } from '@infrastructure/http/use-case.provider';
import { Module } from '@nestjs/common';
import { SaleAndCostsController } from './sale-and-costs.controller';
import { SaleAndCostsService } from './sale-and-costs.service';
import { RecordSaleUseCase } from '@domain/sale-and-costs/use-cases/record-sale.use-case';
import { AddProductionCostUseCase } from '@domain/sale-and-costs/use-cases/add-production-cost.use-case';
import { GetHarvestProfitUseCase } from '@domain/sale-and-costs/use-cases/get-harvest-profit.use-case';
import { DryKilogramProjector } from '@domain/sale-and-costs/dry-kilogram-projector';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { OwnershipModule } from '@infrastructure/http/ownership.module';

@Module({
  imports: [PersistenceModule, OwnershipModule],
  controllers: [SaleAndCostsController],
  providers: [
    SaleAndCostsService,
    useCaseProvider(RecordSaleUseCase, ['SALE_REPOSITORY', 'HARVEST_REPOSITORY', 'PAYMENT_REPOSITORY', 'WEIGHING_REPOSITORY', 'HARVEST_WORKER_REPOSITORY']),
    useCaseProvider(AddProductionCostUseCase, ['PRODUCTION_COST_REPOSITORY', 'HARVEST_REPOSITORY', 'SALE_REPOSITORY']),
    useCaseProvider(GetHarvestProfitUseCase, ['SALE_REPOSITORY', 'PAYMENT_REPOSITORY', 'WEIGHING_REPOSITORY', 'HARVEST_WORKER_REPOSITORY', 'HARVEST_REPOSITORY', 'PRODUCTION_COST_REPOSITORY']),
    DryKilogramProjector,
  ],
  exports: [SaleAndCostsService],
})
export class SaleAndCostsModule {}