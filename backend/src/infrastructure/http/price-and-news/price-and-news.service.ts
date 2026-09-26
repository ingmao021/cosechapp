import { Injectable } from '@nestjs/common';
import { CoffeePrice } from '@domain/price-and-news/coffee-price.entity';
import { Notification } from '@domain/price-and-news/notification.entity';
import { CoffeePriceRepository } from '@domain/price-and-news/coffee-price.repository';
import { NotificationRepository } from '@domain/price-and-news/notification.repository';
import { UpdateCoffeePriceUseCase } from '@domain/price-and-news/use-cases/update-coffee-price.use-case';

@Injectable()
export class PriceAndNewsService {
  constructor(
    private readonly coffeePriceRepository: CoffeePriceRepository,
    private readonly notificationRepository: NotificationRepository,
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

  async getNotificationsByCoffeeGrower(coffeeGrowerId: string): Promise<Notification[]> {
    return this.notificationRepository.findAllByCoffeeGrowerId(coffeeGrowerId);
  }

  async getUnreadNotificationsByCoffeeGrower(coffeeGrowerId: string): Promise<Notification[]> {
    return this.notificationRepository.findUnreadByCoffeeGrowerId(coffeeGrowerId);
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) return null;
    
    const updated = notification.markAsRead();
    return this.notificationRepository.save(updated);
  }
}