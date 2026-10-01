import { Injectable, Inject } from '@nestjs/common';
import { CoffeePrice } from '@domain/price-and-news/coffee-price.entity';
import { Notification } from '@domain/price-and-news/notification.entity';
import { CoffeePriceRepository } from '@domain/price-and-news/coffee-price.repository';
import { NotificationRepository } from '@domain/price-and-news/notification.repository';
import { UpdateCoffeePriceUseCase } from '@domain/price-and-news/use-cases/update-coffee-price.use-case';
import { ResourceNotFoundError } from '@shared/errors/domain-errors';

export interface NotificationWithPrice {
  notification: Notification;
  /** Precio FNC vigente cuando se creó la notificación. */
  priceValue: number | null;
}

@Injectable()
export class PriceAndNewsService {
  constructor(
    @Inject('COFFEE_PRICE_REPOSITORY') private readonly coffeePriceRepository: CoffeePriceRepository,
    @Inject('NOTIFICATION_REPOSITORY') private readonly notificationRepository: NotificationRepository,
    private readonly updateCoffeePriceUseCase: UpdateCoffeePriceUseCase,
  ) {}

  async updateCoffeePrice(value: number, queryDate?: Date) {
    return this.updateCoffeePriceUseCase.execute({ value, queryDate });
  }

  async getLatestCoffeePrice(): Promise<CoffeePrice | null> {
    return this.coffeePriceRepository.findLatest();
  }

  async getCoffeePriceHistory(): Promise<CoffeePrice[]> {
    return this.coffeePriceRepository.findAll();
  }

  async getNotificationsByCoffeeGrower(coffeeGrowerId: string): Promise<NotificationWithPrice[]> {
    return this.withPrice(await this.notificationRepository.findAllByCoffeeGrowerId(coffeeGrowerId));
  }

  async getUnreadNotificationsByCoffeeGrower(coffeeGrowerId: string): Promise<NotificationWithPrice[]> {
    return this.withPrice(await this.notificationRepository.findUnreadByCoffeeGrowerId(coffeeGrowerId));
  }

  /**
   * Cada notificación nace al publicarse un precio nuevo: se le asocia el precio vigente
   * en ese momento (el último publicado hasta su fecha), sin guardarlo dos veces.
   */
  private async withPrice(notifications: Notification[]): Promise<NotificationWithPrice[]> {
    if (notifications.length === 0) return [];
    const prices = [...(await this.coffeePriceRepository.findAll())].sort(
      (a, b) => a.queryDate.getTime() - b.queryDate.getTime(),
    );
    return notifications.map((notification) => {
      const atThatTime = prices.filter((price) => price.queryDate.getTime() <= notification.date.getTime() + 60_000);
      return { notification, priceValue: atThatTime[atThatTime.length - 1]?.value ?? null };
    });
  }

  async markNotificationAsRead(coffeeGrowerId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(notificationId);
    // Una notificación de otro usuario responde igual que una inexistente (404).
    if (!notification || notification.coffeeGrowerId !== coffeeGrowerId) {
      throw new ResourceNotFoundError('Notification not found');
    }
    return this.notificationRepository.save(notification.markAsRead());
  }
}