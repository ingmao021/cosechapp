import { CoffeePrice } from '../coffee-price.entity';
import { CoffeePriceRepository } from '../coffee-price.repository';
import { Notification } from '../notification.entity';
import { NotificationRepository } from '../notification.repository';
import { CoffeeGrowerRepository } from '@domain/auth/coffee-grower.repository';
import { NotificationType } from '../notification.entity';

export interface UpdateCoffeePriceUseCaseInput {
  value: number;
  queryDate?: Date;
}

export interface UpdateCoffeePriceUseCaseOutput {
  coffeePrice: CoffeePrice;
  hasChanged: boolean;
  notificationsCreated: number;
}

export class UpdateCoffeePriceUseCase {
  constructor(
    private readonly coffeePriceRepository: CoffeePriceRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly coffeeGrowerRepository: CoffeeGrowerRepository,
  ) {}

  async execute(input: UpdateCoffeePriceUseCaseInput): Promise<UpdateCoffeePriceUseCaseOutput> {
    const latestPrice = await this.coffeePriceRepository.findLatest();
    
    let coffeePrice: CoffeePrice;
    let hasChanged = false;
    let notificationsCreated = 0;

    if (latestPrice && latestPrice.hasChanged(input.value)) {
      hasChanged = true;
      coffeePrice = latestPrice.updateValue(input.value);
      await this.coffeePriceRepository.save(coffeePrice);

      // Create notifications for all coffee growers
      const coffeeGrowers = await this.coffeeGrowerRepository.findAll();
      for (const grower of coffeeGrowers) {
        const notification = Notification.create(
          crypto.randomUUID(),
          grower.id,
          NotificationType.PRICE_CHANGE,
        );
        await this.notificationRepository.save(notification);
        notificationsCreated++;
      }
    } else if (!latestPrice) {
      // First price ever
      coffeePrice = CoffeePrice.create(crypto.randomUUID(), input.value, input.queryDate ?? new Date());
      await this.coffeePriceRepository.save(coffeePrice);
    } else {
      coffeePrice = latestPrice;
    }

    return { coffeePrice, hasChanged, notificationsCreated };
  }
}