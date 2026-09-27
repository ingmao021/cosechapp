import { Sale } from './sale.entity';

export interface SaleRepository {
  save(sale: Sale): Promise<Sale>;
  findByHarvestId(harvestId: string): Promise<Sale | null>;
  findById(id: string): Promise<Sale | null>;
}