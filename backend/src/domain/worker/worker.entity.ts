export class CatalogWorker {
  private constructor(
    public readonly id: string,
    public readonly coffeeGrowerId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly alias: string | null,
    public readonly phoneNumber: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    coffeeGrowerId: string,
    firstName: string,
    lastName: string,
    alias: string | null = null,
    phoneNumber: string | null = null,
  ): CatalogWorker {
    const now = new Date();
    return new CatalogWorker(id, coffeeGrowerId, firstName, lastName, alias, phoneNumber, now, now);
  }

  static reconstitute(
    id: string,
    coffeeGrowerId: string,
    firstName: string,
    lastName: string,
    alias: string | null,
    phoneNumber: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): CatalogWorker {
    return new CatalogWorker(
      id,
      coffeeGrowerId,
      firstName,
      lastName,
      alias,
      phoneNumber,
      createdAt,
      updatedAt,
    );
  }

  getDisplayName(): string {
    return this.alias ?? `${this.firstName} ${this.lastName}`;
  }

  updateDetails(
    firstName: string,
    lastName: string,
    alias: string | null,
    phoneNumber: string | null,
  ): CatalogWorker {
    return CatalogWorker.reconstitute(
      this.id,
      this.coffeeGrowerId,
      firstName,
      lastName,
      alias,
      phoneNumber,
      this.createdAt,
      new Date(),
    );
  }
}