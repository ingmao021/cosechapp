import { CoffeeGrower } from '@domain/auth/coffee-grower.entity';
import { CoffeeGrowerRepository } from '@domain/auth/coffee-grower.repository';
import { PrismaService } from './prisma.service';

export class PrismaCoffeeGrowerRepository implements CoffeeGrowerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(coffeeGrower: CoffeeGrower): Promise<CoffeeGrower> {
    const saved = await this.client.coffeeGrower.upsert({
      where: { id: coffeeGrower.id },
      create: this.toPersistence(coffeeGrower),
      update: this.toPersistence(coffeeGrower),
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<CoffeeGrower | null> {
    const found = await this.client.coffeeGrower.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findByNationalId(nationalId: string): Promise<CoffeeGrower | null> {
    const found = await this.client.coffeeGrower.findUnique({ where: { nationalId } });
    return found ? this.toDomain(found) : null;
  }

  private toDomain(prisma: any): CoffeeGrower {
    return CoffeeGrower.reconstitute(
      prisma.id,
      prisma.nationalId,
      prisma.passwordHash,
      prisma.profilePhoto,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: CoffeeGrower) {
    return {
      id: domain.id,
      nationalId: domain.nationalId,
      passwordHash: domain.passwordHash,
      profilePhoto: domain.profilePhoto,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}