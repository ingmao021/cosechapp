import { Notification } from './notification.entity';

export interface NotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findAllByCoffeeGrowerId(coffeeGrowerId: string): Promise<Notification[]>;
  findUnreadByCoffeeGrowerId(coffeeGrowerId: string): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
}