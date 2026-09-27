import { WeighingRepository } from '@domain/weighing/weighing.repository';

export interface PaymentCalculatorStrategy {
  calculate(
    totalKilograms: number,
    pricePerKilogram: number,
    includesMeals: boolean,
    mealDetail: string | null,
  ): number;
}

export class PieceRateCalculator implements PaymentCalculatorStrategy {
  calculate(
    totalKilograms: number,
    pricePerKilogram: number,
    includesMeals: boolean,
    mealDetail: string | null,
  ): number {
    const grossPayment = totalKilograms * pricePerKilogram;
    
    let mealDeduction = 0;
    if (includesMeals && mealDetail) {
      // mealDetail format: "pricePerMeal" or "dailyTotal"
      // For simplicity, we parse it as a number
      const mealValue = parseFloat(mealDetail);
      if (!isNaN(mealValue)) {
        mealDeduction = mealValue;
      }
    }

    // Payment is negative (outgoing money)
    return -(grossPayment - mealDeduction);
  }
}

export class PaymentCalculatorFactory {
  static create(type: string = 'piece-rate'): PaymentCalculatorStrategy {
    switch (type) {
      case 'piece-rate':
      default:
        return new PieceRateCalculator();
    }
  }
}