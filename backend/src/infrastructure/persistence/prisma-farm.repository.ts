import { Farm } from '@domain/farm/farm.entity';
import { FarmRepository } from '@domain/farm/farm.repository';
import { PrismaService } from './prisma.service';

export class PrismaFarmRepository implements FarmRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(farm: Farm): Promise<Farm> {
    const saved = await this.client.farm.upsert({
      where: { id: farm.id },
      create: this.toPersistence(farm),
      update: this.toPersistence(farm),
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Farm | null> {
    const found = await this.client.farm.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findByCoffeeGrowerId(coffeeGrowerId: string): Promise<Farm | null> {
    const found = await this.client.farm.findUnique({ where: { coffeeGrowerId } });
    return found ? this.toDomain(found) : null;
  }

  private toDomain(prisma: any): Farm {
    return Farm.reconstitute(
      prisma.id,
      prisma.coffeeGrowerId,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: Farm) {
    return {
      id: domain.id,
      coffeeGrowerId: domain.coffeeGrowerId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}