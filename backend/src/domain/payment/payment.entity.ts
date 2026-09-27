import { InvalidPaymentAmountError } from '@shared/errors/domain-errors';

export class Payment {
  private constructor(
    public readonly id: string,
    public readonly harvestPickerId: string,
    public readonly amount: number, // Negative value
    public readonly includesMeals: boolean,
    public readonly mealDetail: string | null,
    public readonly dateTime: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    harvestPickerId: string,
    amount: number,
    includesMeals: boolean = false,
    mealDetail: string | null = null,
    dateTime: Date = new Date(),
  ): Payment {
    if (amount >= 0) {
      throw new InvalidPaymentAmountError();
    }
    const now = new Date();
    return new Payment(id, harvestPickerId, amount, includesMeals, mealDetail, dateTime, now, now);
  }

  static reconstitute(
    id: string,
    harvestPickerId: string,
    amount: number,
    includesMeals: boolean,
    mealDetail: string | null,
    dateTime: Date,
    createdAt: Date,
    updatedAt: Date,
  ): Payment {
    return new Payment(id, harvestPickerId, amount, includesMeals, mealDetail, dateTime, createdAt, updatedAt);
  }
}