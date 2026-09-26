export class CoffeeGrower {
  private constructor(
    public readonly id: string,
    public readonly nationalId: string,
    public readonly passwordHash: string,
    public readonly profilePhoto: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    nationalId: string,
    passwordHash: string,
    profilePhoto: string | null = null,
  ): CoffeeGrower {
    const now = new Date();
    return new CoffeeGrower(id, nationalId, passwordHash, profilePhoto, now, now);
  }

  static reconstitute(
    id: string,
    nationalId: string,
    passwordHash: string,
    profilePhoto: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): CoffeeGrower {
    return new CoffeeGrower(id, nationalId, passwordHash, profilePhoto, createdAt, updatedAt);
  }

  updateProfilePhoto(photo: string | null): CoffeeGrower {
    return CoffeeGrower.reconstitute(
      this.id,
      this.nationalId,
      this.passwordHash,
      photo,
      this.createdAt,
      new Date(),
    );
  }

  updatePassword(newPasswordHash: string): CoffeeGrower {
    return CoffeeGrower.reconstitute(
      this.id,
      this.nationalId,
      newPasswordHash,
      this.profilePhoto,
      this.createdAt,
      new Date(),
    );
  }
}