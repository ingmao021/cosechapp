import { Module } from '@nestjs/common';
import { SaleAndCostsController } from './sale-and-costs.controller';
import { SaleAndCostsService } from './sale-and-costs.service';
import { RecordSaleUseCase } from '@domain/sale-and-costs/use-cases/record-sale.use-case';
import { AddProductionCostUseCase } from '@domain/sale-and-costs/use-cases/add-production-cost.use-case';
import { GetHarvestProfitUseCase } from '@domain/sale-and-costs/use-cases/get-harvest-profit.use-case';
import { DryKilogramProjector } from '@domain/sale-and-costs/dry-kilogram-projector';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [SaleAndCostsController],
  providers: [
    SaleAndCostsService,
    RecordSaleUseCase,
    AddProductionCostUseCase,
    GetHarvestProfitUseCase,
    DryKilogramProjector,
  ],
  exports: [SaleAndCostsService],
})
export class SaleAndCostsModule {}