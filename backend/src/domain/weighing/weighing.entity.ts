import { InvalidKilogramsError } from '@shared/errors/domain-errors';

export class Weighing {
  private constructor(
    public readonly id: string,
    public readonly harvestPickerId: string,
    public readonly kilograms: number,
    public readonly dateTime: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    harvestPickerId: string,
    kilograms: number,
    dateTime: Date = new Date(),
  ): Weighing {
    if (kilograms <= 0) {
      throw new InvalidKilogramsError();
    }
    const now = new Date();
    return new Weighing(id, harvestPickerId, kilograms, dateTime, now, now);
  }

  static reconstitute(
    id: string,
    harvestPickerId: string,
    kilograms: number,
    dateTime: Date,
    createdAt: Date,
    updatedAt: Date,
  ): Weighing {
    return new Weighing(id, harvestPickerId, kilograms, dateTime, createdAt, updatedAt);
  }

  updateKilograms(kilograms: number): Weighing {
    if (kilograms <= 0) {
      throw new InvalidKilogramsError();
    }
    return Weighing.reconstitute(
      this.id,
      this.harvestPickerId,
      kilograms,
      this.dateTime,
      this.createdAt,
      new Date(),
    );
  }
}