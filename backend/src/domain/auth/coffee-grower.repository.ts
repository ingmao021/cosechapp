import { CoffeeGrower } from './coffee-grower.entity';

export interface CoffeeGrowerRepository {
  save(coffeeGrower: CoffeeGrower): Promise<CoffeeGrower>;
  findById(id: string): Promise<CoffeeGrower | null>;
  findByNationalId(nationalId: string): Promise<CoffeeGrower | null>;
}