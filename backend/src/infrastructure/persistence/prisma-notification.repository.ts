import { Notification } from '@domain/price-and-news/notification.entity';
import { NotificationRepository } from '@domain/price-and-news/notification.repository';
import { NotificationType } from '@domain/price-and-news/notification.entity';
import { PrismaService } from './prisma.service';

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(notification: Notification): Promise<Notification> {
    const saved = await this.client.notification.upsert({
      where: { id: notification.id },
      create: this.toPersistence(notification),
      update: this.toPersistence(notification),
    });
    return this.toDomain(saved);
  }

  async findAllByCoffeeGrowerId(coffeeGrowerId: string): Promise<Notification[]> {
    const found = await this.client.notification.findMany({
      where: { coffeeGrowerId },
      orderBy: { date: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findUnreadByCoffeeGrowerId(coffeeGrowerId: string): Promise<Notification[]> {
    const found = await this.client.notification.findMany({
      where: { coffeeGrowerId, read: false },
      orderBy: { date: 'desc' },
    });
    return found.map(this.toDomain);
  }

  async findById(id: string): Promise<Notification | null> {
    const found = await this.client.notification.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  private toDomain(prisma: any): Notification {
    return Notification.reconstitute(
      prisma.id,
      prisma.coffeeGrowerId,
      prisma.type,
      prisma.date,
      prisma.read,
      prisma.createdAt,
    );
  }

  private toPersistence(domain: Notification) {
    return {
      id: domain.id,
      coffeeGrowerId: domain.coffeeGrowerId,
      type: domain.type,
      date: domain.date,
      read: domain.read,
      createdAt: domain.createdAt,
    };
  }
}