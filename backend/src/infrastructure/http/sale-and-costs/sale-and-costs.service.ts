import { Injectable } from '@nestjs/common';
import { Sale } from '@domain/sale-and-costs/sale.entity';
import { ProductionCost } from '@domain/sale-and-costs/production-cost.entity';
import { SaleRepository } from '@domain/sale-and-costs/sale.repository';
import { ProductionCostRepository } from '@domain/sale-and-costs/production-cost.repository';
import { RecordSaleUseCase } from '@domain/sale-and-costs/use-cases/record-sale.use-case';
import { AddProductionCostUseCase } from '@domain/sale-and-costs/use-cases/add-production-cost.use-case';
import { GetHarvestProfitUseCase } from '@domain/sale-and-costs/use-cases/get-harvest-profit.use-case';
import { DryKilogramProjector } from '@domain/sale-and-costs/dry-kilogram-projector';

@Injectable()
export class SaleAndCostsService {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly productionCostRepository: ProductionCostRepository,
    private readonly recordSaleUseCase: RecordSaleUseCase,
    private readonly addProductionCostUseCase: AddProductionCostUseCase,
    private readonly getHarvestProfitUseCase: GetHarvestProfitUseCase,
  ) {}

  async recordSale(input: { harvestId: string; actualDryKilograms: number; salePrice: number; date: Date }) {
    return this.recordSaleUseCase.execute(input);
  }

  async addProductionCost(input: { harvestId: string; description: string; amount: number; date: Date }) {
    return this.addProductionCostUseCase.execute(input);
  }

  async getHarvestProfit(harvestId: string) {
    return this.getHarvestProfitUseCase.execute({ harvestId });
  }

  async projectDryKilograms(cherryKilograms: number): Promise<number> {
    return DryKilogramProjector.project(cherryKilograms);
  }

  async getSaleByHarvestId(harvestId: string): Promise<Sale | null> {
    return this.saleRepository.findByHarvestId(harvestId);
  }

  async getProductionCostsByHarvestId(harvestId: string): Promise<ProductionCost[]> {
    return this.productionCostRepository.findAllByHarvestId(harvestId);
  }

  async addProductionCostDirect(input: { harvestId: string; description: string; amount: number; date: Date }): Promise<ProductionCost> {
    const cost = ProductionCost.create(
      crypto.randomUUID(),
      input.harvestId,
      input.description,
      input.amount,
      input.date,
    );
    return this.productionCostRepository.save(cost);
  }
}