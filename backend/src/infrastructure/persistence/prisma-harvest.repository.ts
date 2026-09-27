import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { HarvestStatus } from '@domain/harvest/harvest-status.enum';
import { PrismaService } from './prisma.service';

export class PrismaHarvestRepository implements HarvestRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(harvest: Harvest): Promise<Harvest> {
    const saved = await this.client.harvest.upsert({
      where: { id: harvest.id },
      create: this.toPersistence(harvest),
      update: this.toPersistence(harvest),
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Harvest | null> {
    const found = await this.client.harvest.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findActiveByFarmId(farmId: string): Promise<Harvest | null> {
    const found = await this.client.harvest.findFirst({
      where: { farmId, status: 'ACTIVE' },
    });
    return found ? this.toDomain(found) : null;
  }

  async findAllByFarmId(farmId: string): Promise<Harvest[]> {
    const found = await this.client.harvest.findMany({
      where: { farmId },
      orderBy: { openingDate: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findByIdAndFarmId(id: string, farmId: string): Promise<Harvest | null> {
    const found = await this.client.harvest.findFirst({
      where: { id, farmId },
    });
    return found ? this.toDomain(found) : null;
  }

  async findAllByFarmIdWithStatus(farmId: string, status: HarvestStatus): Promise<Harvest[]> {
    const found = await this.client.harvest.findMany({
      where: { farmId, status },
      orderBy: { openingDate: 'desc' },
    });
    return found.map(this.toDomain);
  }

  private toDomain(prisma: any): Harvest {
    return Harvest.reconstitute(
      prisma.id,
      prisma.farmId,
      prisma.name,
      Number(prisma.pricePerKilogram),
      prisma.status,
      prisma.openingDate,
      prisma.closingDate,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: Harvest) {
    return {
      id: domain.id,
      farmId: domain.farmId,
      name: domain.name,
      pricePerKilogram: domain.pricePerKilogram,
      status: domain.status,
      openingDate: domain.openingDate,
      closingDate: domain.closingDate,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}