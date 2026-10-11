import { Injectable } from '@nestjs/common';
import { PriceInsight } from '@domain/price-and-news/price-insight.entity';
import { PriceInsightRepository } from '@domain/price-and-news/price-insight.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaPriceInsightRepository implements PriceInsightRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(insight: PriceInsight): Promise<PriceInsight> {
    const data = {
      id: insight.id,
      text: insight.text,
      coffeePriceId: insight.coffeePriceId,
      createdAt: insight.createdAt,
    };
    const saved = await this.client.priceInsight.upsert({ where: { id: insight.id }, create: data, update: data });
    return this.toDomain(saved);
  }

  async findLatest(): Promise<PriceInsight | null> {
    const found = await this.client.priceInsight.findFirst({ orderBy: { createdAt: 'desc' } });
    return found ? this.toDomain(found) : null;
  }

  private toDomain(prisma: any): PriceInsight {
    return PriceInsight.reconstitute(prisma.id, prisma.text, prisma.coffeePriceId, prisma.createdAt);
  }
}
