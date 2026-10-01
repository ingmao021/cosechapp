import { BusinessRuleViolationError } from '@shared/errors/domain-errors';
export class CoffeePrice {
  private constructor(
    public readonly id: string,
    public readonly value: number,
    public readonly queryDate: Date,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    value: number,
    queryDate: Date = new Date(),
  ): CoffeePrice {
    if (value <= 0) {
      throw new BusinessRuleViolationError('Coffee price must be positive');
    }
    const now = new Date();
    return new CoffeePrice(id, value, queryDate, now);
  }

  static reconstitute(
    id: string,
    value: number,
    queryDate: Date,
    createdAt: Date,
  ): CoffeePrice {
    return new CoffeePrice(id, value, queryDate, createdAt);
  }

  hasChanged(newValue: number): boolean {
    return this.value !== newValue;
  }

  updateValue(newValue: number): CoffeePrice {
    if (newValue <= 0) {
      throw new BusinessRuleViolationError('Coffee price must be positive');
    }
    return CoffeePrice.reconstitute(this.id, newValue, new Date(), this.createdAt);
  }
}