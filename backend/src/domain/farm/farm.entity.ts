export class Farm {
  private constructor(
    public readonly id: string,
    public readonly coffeeGrowerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(id: string, coffeeGrowerId: string): Farm {
    const now = new Date();
    return new Farm(id, coffeeGrowerId, now, now);
  }

  static reconstitute(
    id: string,
    coffeeGrowerId: string,
    createdAt: Date,
    updatedAt: Date,
  ): Farm {
    return new Farm(id, coffeeGrowerId, createdAt, updatedAt);
  }
}