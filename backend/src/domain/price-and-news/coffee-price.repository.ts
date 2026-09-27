import { CoffeePrice } from './coffee-price.entity';

export interface CoffeePriceRepository {
  save(coffeePrice: CoffeePrice): Promise<CoffeePrice>;
  findLatest(): Promise<CoffeePrice | null>;
  findAll(): Promise<CoffeePrice[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<CoffeePrice[]>;
}