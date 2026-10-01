import { Injectable } from '@nestjs/common';
import { Sale } from '@domain/sale-and-costs/sale.entity';
import { SaleRepository } from '@domain/sale-and-costs/sale.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaSaleRepository implements SaleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(sale: Sale): Promise<Sale> {
    const saved = await this.client.sale.upsert({
      where: { harvestId: sale.harvestId },
      create: this.toPersistence(sale),
      update: this.toPersistence(sale),
    });
    return this.toDomain(saved);
  }

  async findByHarvestId(harvestId: string): Promise<Sale | null> {
    const found = await this.client.sale.findUnique({ where: { harvestId } });
    return found ? this.toDomain(found) : null;
  }

  async findById(id: string): Promise<Sale | null> {
    const found = await this.client.sale.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  private toDomain(prisma: any): Sale {
    return Sale.reconstitute(
      prisma.id,
      prisma.harvestId,
      Number(prisma.actualDryKilograms),
      Number(prisma.salePrice),
      prisma.date,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: Sale) {
    return {
      id: domain.id,
      harvestId: domain.harvestId,
      actualDryKilograms: domain.actualDryKilograms,
      salePrice: domain.salePrice,
      date: domain.date,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}