import { ProductionCost } from './production-cost.entity';

export interface ProductionCostRepository {
  save(cost: ProductionCost): Promise<ProductionCost>;
  findAllByHarvestId(harvestId: string): Promise<ProductionCost[]>;
  findById(id: string): Promise<ProductionCost | null>;
  delete(id: string): Promise<void>;
  getTotalByHarvestId(harvestId: string): Promise<number>;
}