import { Payment } from '@domain/payment/payment.entity';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { PrismaService } from './prisma.service';

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(payment: Payment): Promise<Payment> {
    const saved = await this.client.payment.upsert({
      where: { id: payment.id },
      create: this.toPersistence(payment),
      update: this.toPersistence(payment),
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Payment | null> {
    const found = await this.client.payment.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findAllByHarvestPickerId(harvestPickerId: string): Promise<Payment[]> {
    const found = await this.client.payment.findMany({
      where: { harvestPickerId },
      orderBy: { dateTime: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findTotalPaidByHarvestPickerId(harvestPickerId: string): Promise<number> {
    const result = await this.client.payment.aggregate({
      where: { harvestPickerId },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private toDomain(prisma: any): Payment {
    return Payment.reconstitute(
      prisma.id,
      prisma.harvestPickerId,
      Number(prisma.amount),
      prisma.includesMeals,
      prisma.mealDetail,
      prisma.dateTime,
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  private toPersistence(domain: Payment) {
    return {
      id: domain.id,
      harvestPickerId: domain.harvestPickerId,
      amount: domain.amount,
      includesMeals: domain.includesMeals,
      mealDetail: domain.mealDetail,
      dateTime: domain.dateTime,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}