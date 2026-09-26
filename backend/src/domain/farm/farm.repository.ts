import { Farm } from './farm.entity';

export interface FarmRepository {
  save(farm: Farm): Promise<Farm>;
  findById(id: string): Promise<Farm | null>;
  findByCoffeeGrowerId(coffeeGrowerId: string): Promise<Farm | null>;
}