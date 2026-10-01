import { Injectable } from '@nestjs/common';
import { Weighing } from '@domain/weighing/weighing.entity';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaWeighingRepository implements WeighingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(weighing: Weighing): Promise<Weighing> {
    const saved = await this.client.weightRecord.upsert({
      where: { id: weighing.id },
      create: this.toPersistence(weighing),
      update: this.toPersistence(weighing),
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Weighing | null> {
    const found = await this.client.weightRecord.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findAllByHarvestPickerId(harvestPickerId: string): Promise<Weighing[]> {
    const found = await this.client.weightRecord.findMany({
      where: { harvestPickerId },
      orderBy: { dateTime: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findByHarvestPickerIdAndDateRange(
    harvestPickerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Weighing[]> {
    const found = await this.client.weightRecord.findMany({
      where: {
        harvestPickerId,
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { dateTime: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async getTotalKilogramsByHarvestPickerId(harvestPickerId: string): Promise<number> {
    const result = await this.client.weightRecord.aggregate({
      where: { harvestPickerId },
      _sum: { kilograms: true },
    });
    return Number(result._sum.kilograms ?? 0);
  }

  async getTotalKilogramsByHarvestPickerIdAndDateRange(
    harvestPickerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.client.weightRecord.aggregate({
      where: {
        harvestPickerId,
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { kilograms: true },
    });
    return Number(result._sum.kilograms ?? 0);
  }

  async delete(id: string): Promise<void> {
    await this.client.weightRecord.delete({ where: { id } });
  }

  private toDomain(prisma: any): Weighing {
    return Weighing.reconstitute(
      prisma.id,
      prisma.harvestPickerId,
      Number(prisma.kilograms),
      prisma.dateTime,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: Weighing) {
    return {
      id: domain.id,
      harvestPickerId: domain.harvestPickerId,
      kilograms: domain.kilograms,
      dateTime: domain.dateTime,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}