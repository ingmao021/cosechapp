import { Injectable } from '@nestjs/common';
import { Crew } from '@domain/harvest/crew.entity';
import { CrewRepository } from '@domain/harvest/crew.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaCrewRepository implements CrewRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(crew: Crew): Promise<Crew> {
    const saved = await this.client.crew.upsert({
      where: { id: crew.id },
      create: this.toPersistence(crew),
      update: this.toPersistence(crew),
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Crew | null> {
    const found = await this.client.crew.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findAllByHarvestId(harvestId: string): Promise<Crew[]> {
    const found = await this.client.crew.findMany({
      where: { harvestId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findByIdAndHarvestId(id: string, harvestId: string): Promise<Crew | null> {
    const found = await this.client.crew.findFirst({
      where: { id, harvestId },
    });
    return found ? this.toDomain(found) : null;
  }

  async delete(id: string): Promise<void> {
    await this.client.crew.delete({ where: { id } });
  }

  private toDomain(prisma: any): Crew {
    return Crew.reconstitute(
      prisma.id,
      prisma.harvestId,
      prisma.name,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: Crew) {
    return {
      id: domain.id,
      harvestId: domain.harvestId,
      name: domain.name,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}