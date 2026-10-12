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
    /** Liquidación al cerrar la cosecha (no un pago anticipado de quien se va). */
    public readonly isSettlement: boolean = false,
  ) {}

  static create(
    id: string,
    harvestPickerId: string,
    amount: number,
    includesMeals: boolean = false,
    mealDetail: string | null = null,
    dateTime: Date = new Date(),
    isSettlement: boolean = false,
  ): Payment {
    // Efectivo en 0 solo si la comida descontada cubrió todo el saldo (queda registrada igual).
    const coveredByMeals = amount === 0 && includesMeals && Number(mealDetail) > 0;
    if (amount > 0 || (amount === 0 && !coveredByMeals)) {
      throw new InvalidPaymentAmountError();
    }
    const now = new Date();
    return new Payment(id, harvestPickerId, amount, includesMeals, mealDetail, dateTime, now, now, isSettlement);
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
    isSettlement: boolean = false,
  ): Payment {
    return new Payment(id, harvestPickerId, amount, includesMeals, mealDetail, dateTime, createdAt, updatedAt, isSettlement);
  }
}