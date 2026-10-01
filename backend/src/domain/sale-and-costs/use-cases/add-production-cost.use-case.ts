import { BusinessRuleViolationError, ResourceNotFoundError } from '@shared/errors/domain-errors';
import { ProductionCost } from '../production-cost.entity';
import { ProductionCostRepository } from '../production-cost.repository';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { SaleRepository } from '../sale.repository';

export interface AddProductionCostUseCaseInput {
  harvestId: string;
  description: string;
  amount: number;
  date: Date;
}

export interface AddProductionCostUseCaseOutput {
  cost: ProductionCost;
  actualProfit: number;
}

export class AddProductionCostUseCase {
  constructor(
    private readonly productionCostRepository: ProductionCostRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly saleRepository: SaleRepository,
  ) {}

  async execute(input: AddProductionCostUseCaseInput): Promise<AddProductionCostUseCaseOutput> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new ResourceNotFoundError('Harvest not found');
    }
    if (!harvest.isClosed()) {
      throw new BusinessRuleViolationError('Harvest must be closed before adding production costs');
    }

    const sale = await this.saleRepository.findByHarvestId(input.harvestId);
    if (!sale) {
      throw new BusinessRuleViolationError('Sale must be recorded before adding production costs');
    }

    if (input.amount >= 0) {
      throw new BusinessRuleViolationError('Production cost amount must be negative');
    }

    const cost = ProductionCost.create(
      crypto.randomUUID(),
      input.harvestId,
      input.description,
      input.amount,
      input.date,
    );

    const saved = await this.productionCostRepository.save(cost);

    // Calculate actual profit: gross profit - production costs
    const totalCosts = await this.productionCostRepository.getTotalByHarvestId(input.harvestId);
    const grossProfit = await this.calculateGrossProfit(input.harvestId);
    const actualProfit = grossProfit + totalCosts; // totalCosts is negative

    return { cost: saved, actualProfit };
  }

  private async calculateGrossProfit(harvestId: string): Promise<number> {
    const sale = await this.saleRepository.findByHarvestId(harvestId);
    if (!sale) return 0;
    
    // This would need payment and weighing repositories to calculate properly
    // For now, we'll return the gross revenue
    return sale.calculateGrossRevenue();
  }
}