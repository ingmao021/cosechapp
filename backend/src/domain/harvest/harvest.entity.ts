import { BusinessRuleViolationError } from '@shared/errors/domain-errors';
import { HarvestStatus } from './harvest-status.enum';

export class Harvest {
  private constructor(
    public readonly id: string,
    public readonly farmId: string,
    public readonly name: string,
    public readonly pricePerKilogram: number,
    public readonly status: HarvestStatus,
    public readonly openingDate: Date,
    public readonly closingDate: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    farmId: string,
    name: string,
    pricePerKilogram: number,
  ): Harvest {
    const now = new Date();
    return new Harvest(
      id,
      farmId,
      name,
      pricePerKilogram,
      HarvestStatus.ACTIVE,
      now,
      null,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    farmId: string,
    name: string,
    pricePerKilogram: number,
    status: HarvestStatus,
    openingDate: Date,
    closingDate: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ): Harvest {
    return new Harvest(
      id,
      farmId,
      name,
      pricePerKilogram,
      status,
      openingDate,
      closingDate,
      createdAt,
      updatedAt,
    );
  }

  close(closingDate: Date = new Date()): Harvest {
    if (this.status === HarvestStatus.CLOSED) {
      throw new BusinessRuleViolationError('Harvest is already closed');
    }
    return Harvest.reconstitute(
      this.id,
      this.farmId,
      this.name,
      this.pricePerKilogram,
      HarvestStatus.CLOSED,
      this.openingDate,
      closingDate,
      this.createdAt,
      new Date(),
    );
  }

  isActive(): boolean {
    return this.status === HarvestStatus.ACTIVE;
  }

  isClosed(): boolean {
    return this.status === HarvestStatus.CLOSED;
  }
}