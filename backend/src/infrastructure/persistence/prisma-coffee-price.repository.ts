import { CoffeePrice } from '@domain/price-and-news/coffee-price.entity';
import { CoffeePriceRepository } from '@domain/price-and-news/coffee-price.repository';
import { PrismaService } from './prisma.service';

export class PrismaCoffeePriceRepository implements CoffeePriceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(coffeePrice: CoffeePrice): Promise<CoffeePrice> {
    const saved = await this.client.coffeePrice.upsert({
      where: { id: coffeePrice.id },
      create: this.toPersistence(coffeePrice),
      update: this.toPersistence(coffeePrice),
    });
    return this.toDomain(saved);
  }

  async findLatest(): Promise<CoffeePrice | null> {
    const found = await this.client.coffeePrice.findFirst({
      orderBy: { queryDate: 'desc' },
    });
    return found ? this.toDomain(found) : null;
  }

  async findAll(): Promise<CoffeePrice[]> {
    const found = await this.client.coffeePrice.findMany({
      orderBy: { queryDate: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<CoffeePrice[]> {
    const found = await this.client.coffeePrice.findMany({
      where: {
        queryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { queryDate: 'desc' },
    });
    return found.map(this.toDomain);
  }

  private toDomain(prisma: any): CoffeePrice {
    return CoffeePrice.reconstitute(
      prisma.id,
      Number(prisma.value),
      prisma.queryDate,
      prisma.createdAt,
    );
  }

  private toPersistence(domain: CoffeePrice) {
    return {
      id: domain.id,
      value: domain.value,
      queryDate: domain.queryDate,
      createdAt: domain.createdAt,
    };
  }
}