export class Crew {
  private constructor(
    public readonly id: string,
    public readonly harvestId: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    harvestId: string,
    name: string,
  ): Crew {
    const now = new Date();
    return new Crew(id, harvestId, name, now, now);
  }

  static reconstitute(
    id: string,
    harvestId: string,
    name: string,
    createdAt: Date,
    updatedAt: Date,
  ): Crew {
    return new Crew(id, harvestId, name, createdAt, updatedAt);
  }

  updateName(name: string): Crew {
    return Crew.reconstitute(
      this.id,
      this.harvestId,
      name,
      this.createdAt,
      new Date(),
    );
  }
}