import { CatalogWorker } from './worker.entity';

export interface WorkerRepository {
  save(worker: CatalogWorker): Promise<CatalogWorker>;
  findById(id: string): Promise<CatalogWorker | null>;
  findAllByCoffeeGrowerId(coffeeGrowerId: string): Promise<CatalogWorker[]>;
  findByIdAndCoffeeGrowerId(id: string, coffeeGrowerId: string): Promise<CatalogWorker | null>;
  delete(id: string): Promise<void>;
}