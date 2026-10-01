import { Injectable } from '@nestjs/common';
import { CatalogWorker } from '@domain/worker/worker.entity';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaWorkerRepository implements WorkerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(worker: CatalogWorker): Promise<CatalogWorker> {
    const saved = await this.client.worker.upsert({
      where: { id: worker.id },
      create: this.toPersistence(worker),
      update: this.toPersistence(worker),
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<CatalogWorker | null> {
    const found = await this.client.worker.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findAllByCoffeeGrowerId(coffeeGrowerId: string): Promise<CatalogWorker[]> {
    const found = await this.client.worker.findMany({
      where: { coffeeGrowerId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findByIdAndCoffeeGrowerId(id: string, coffeeGrowerId: string): Promise<CatalogWorker | null> {
    const found = await this.client.worker.findFirst({
      where: { id, coffeeGrowerId },
    });
    return found ? this.toDomain(found) : null;
  }

  async delete(id: string): Promise<void> {
    await this.client.worker.delete({ where: { id } });
  }

  private toDomain(prisma: any): CatalogWorker {
    return CatalogWorker.reconstitute(
      prisma.id,
      prisma.coffeeGrowerId,
      prisma.firstName,
      prisma.lastName,
      prisma.alias,
      prisma.phoneNumber,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: CatalogWorker) {
    return {
      id: domain.id,
      coffeeGrowerId: domain.coffeeGrowerId,
      firstName: domain.firstName,
      lastName: domain.lastName,
      alias: domain.alias,
      phoneNumber: domain.phoneNumber,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}