export class ProductionCost {
  private constructor(
    public readonly id: string,
    public readonly harvestId: string,
    public readonly description: string,
    public readonly amount: number, // Negative value
    public readonly date: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    harvestId: string,
    description: string,
    amount: number,
    date: Date = new Date(),
  ): ProductionCost {
    if (amount >= 0) {
      throw new Error('Production cost amount must be negative');
    }
    if (!description || description.trim() === '') {
      throw new Error('Description is required');
    }
    const now = new Date();
    return new ProductionCost(id, harvestId, description, amount, date, now, now);
  }

  static reconstitute(
    id: string,
    harvestId: string,
    description: string,
    amount: number,
    date: Date,
    createdAt: Date,
    updatedAt: Date,
  ): ProductionCost {
    return new ProductionCost(id, harvestId, description, amount, date, createdAt, updatedAt);
  }

  updateDetails(description: string, amount: number): ProductionCost {
    if (amount >= 0) {
      throw new Error('Production cost amount must be negative');
    }
    return ProductionCost.reconstitute(
      this.id,
      this.harvestId,
      description,
      amount,
      this.date,
      this.createdAt,
      new Date(),
    );
  }
}