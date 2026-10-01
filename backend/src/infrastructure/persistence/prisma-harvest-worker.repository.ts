import { Injectable } from '@nestjs/common';
import { HarvestWorker } from '@domain/harvest/harvest-worker.entity';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { HarvestPickerStatus } from '@domain/harvest/harvest-picker-status.enum';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaHarvestWorkerRepository implements HarvestWorkerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(harvestWorker: HarvestWorker): Promise<HarvestWorker> {
    const saved = await this.client.harvestPicker.upsert({
      where: { id: harvestWorker.id },
      create: this.toPersistence(harvestWorker),
      update: this.toPersistence(harvestWorker),
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<HarvestWorker | null> {
    const found = await this.client.harvestPicker.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findByHarvestIdAndWorkerId(harvestId: string, workerId: string): Promise<HarvestWorker | null> {
    const found = await this.client.harvestPicker.findFirst({
      where: { harvestId, workerId },
    });
    return found ? this.toDomain(found) : null;
  }

  async findAllByHarvestId(harvestId: string): Promise<HarvestWorker[]> {
    const found = await this.client.harvestPicker.findMany({
      where: { harvestId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findAllByHarvestIdAndStatus(harvestId: string, status: HarvestPickerStatus): Promise<HarvestWorker[]> {
    const found = await this.client.harvestPicker.findMany({
      where: { harvestId, status },
      orderBy: { createdAt: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findByIdAndHarvestId(id: string, harvestId: string): Promise<HarvestWorker | null> {
    const found = await this.client.harvestPicker.findFirst({
      where: { id, harvestId },
    });
    return found ? this.toDomain(found) : null;
  }

  private toDomain(prisma: any): HarvestWorker {
    return HarvestWorker.reconstitute(
      prisma.id,
      prisma.harvestId,
      prisma.workerId,
      prisma.harvestAlias,
      prisma.crewId,
      prisma.status,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: HarvestWorker) {
    return {
      id: domain.id,
      harvestId: domain.harvestId,
      workerId: domain.workerId,
      harvestAlias: domain.harvestAlias,
      crewId: domain.crewId,
      status: domain.status,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}