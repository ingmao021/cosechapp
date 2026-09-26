import { ProductionCost } from '@domain/sale-and-costs/production-cost.entity';
import { ProductionCostRepository } from '@domain/sale-and-costs/production-cost.repository';
import { PrismaService } from './prisma.service';

export class PrismaProductionCostRepository implements ProductionCostRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(cost: ProductionCost): Promise<ProductionCost> {
    const saved = await this.client.productionCost.upsert({
      where: { id: cost.id },
      create: this.toPersistence(cost),
      update: this.toPersistence(cost),
    });
    return this.toDomain(saved);
  }

  async findAllByHarvestId(harvestId: string): Promise<ProductionCost[]> {
    const found = await this.client.productionCost.findMany({
      where: { harvestId },
      orderBy: { date: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findById(id: string): Promise<ProductionCost | null> {
    const found = await this.client.productionCost.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async delete(id: string): Promise<void> {
    await this.client.productionCost.delete({ where: { id } });
  }

  async getTotalByHarvestId(harvestId: string): Promise<number> {
    const result = await this.client.productionCost.aggregate({
      where: { harvestId },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private toDomain(prisma: any): ProductionCost {
    return ProductionCost.reconstitute(
      prisma.id,
      prisma.harvestId,
      prisma.description,
      Number(prisma.amount),
      prisma.date,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: ProductionCost) {
    return {
      id: domain.id,
      harvestId: domain.harvestId,
      description: domain.description,
      amount: domain.amount,
      date: domain.date,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}