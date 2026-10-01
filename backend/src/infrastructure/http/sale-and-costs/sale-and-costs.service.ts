import { Injectable, Inject } from '@nestjs/common';
import { Sale } from '@domain/sale-and-costs/sale.entity';
import { ProductionCost } from '@domain/sale-and-costs/production-cost.entity';
import { SaleRepository } from '@domain/sale-and-costs/sale.repository';
import { ProductionCostRepository } from '@domain/sale-and-costs/production-cost.repository';
import { RecordSaleUseCase } from '@domain/sale-and-costs/use-cases/record-sale.use-case';
import { AddProductionCostUseCase } from '@domain/sale-and-costs/use-cases/add-production-cost.use-case';
import { GetHarvestProfitUseCase } from '@domain/sale-and-costs/use-cases/get-harvest-profit.use-case';
import { DryKilogramProjector } from '@domain/sale-and-costs/dry-kilogram-projector';
import { OwnershipService } from '@infrastructure/http/ownership.service';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';

@Injectable()
export class SaleAndCostsService {
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
    @Inject('PRODUCTION_COST_REPOSITORY') private readonly productionCostRepository: ProductionCostRepository,
    private readonly recordSaleUseCase: RecordSaleUseCase,
    private readonly addProductionCostUseCase: AddProductionCostUseCase,
    private readonly getHarvestProfitUseCase: GetHarvestProfitUseCase,
    private readonly ownership: OwnershipService,
  ) {}

  async recordSale(user: AuthUser, input: { harvestId: string; actualDryKilograms: number; salePrice: number; date: Date }) {
    await this.ownership.harvestFor(input.harvestId, user.farmId);
    return this.recordSaleUseCase.execute(input);
  }

  /** `amount` llega en positivo (lo que gastó el caficultor); el dominio lo guarda en negativo. */
  async addProductionCost(user: AuthUser, input: { harvestId: string; description: string; amount: number; date: Date }) {
    await this.ownership.harvestFor(input.harvestId, user.farmId);
    const { cost } = await this.addProductionCostUseCase.execute({ ...input, amount: -Math.abs(input.amount) });
    // El caso de uso solo conoce venta y costos; la ganancia real también descuenta los pagos a recolectores.
    const { actualProfit } = await this.getHarvestProfitUseCase.execute({ harvestId: input.harvestId });
    return { cost, actualProfit };
  }

  async getHarvestProfit(user: AuthUser, harvestId: string) {
    await this.ownership.harvestFor(harvestId, user.farmId);
    return this.getHarvestProfitUseCase.execute({ harvestId });
  }

  projectDryKilograms(cherryKilograms: number): number {
    return DryKilogramProjector.project(cherryKilograms);
  }

  async getSaleByHarvestId(user: AuthUser, harvestId: string): Promise<Sale | null> {
    await this.ownership.harvestFor(harvestId, user.farmId);
    return this.saleRepository.findByHarvestId(harvestId);
  }

  async getProductionCostsByHarvestId(user: AuthUser, harvestId: string): Promise<ProductionCost[]> {
    await this.ownership.harvestFor(harvestId, user.farmId);
    return this.productionCostRepository.findAllByHarvestId(harvestId);
  }
}
