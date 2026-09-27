import { SaleAlreadyRecordedError } from '@shared/errors/domain-errors';

export class Sale {
  private constructor(
    public readonly id: string,
    public readonly harvestId: string,
    public readonly actualDryKilograms: number,
    public readonly salePrice: number,
    public readonly date: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    harvestId: string,
    actualDryKilograms: number,
    salePrice: number,
    date: Date = new Date(),
  ): Sale {
    if (actualDryKilograms <= 0) {
      throw new Error('Actual dry kilograms must be positive');
    }
    if (salePrice <= 0) {
      throw new Error('Sale price must be positive');
    }
    const now = new Date();
    return new Sale(id, harvestId, actualDryKilograms, salePrice, date, now, now);
  }

  static reconstitute(
    id: string,
    harvestId: string,
    actualDryKilograms: number,
    salePrice: number,
    date: Date,
    createdAt: Date,
    updatedAt: Date,
  ): Sale {
    return new Sale(id, harvestId, actualDryKilograms, salePrice, date, createdAt, updatedAt);
  }

  calculateGrossRevenue(): number {
    return this.actualDryKilograms * this.salePrice;
  }
}