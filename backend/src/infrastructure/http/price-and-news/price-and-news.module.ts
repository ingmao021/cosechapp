import { Module } from '@nestjs/common';
import { useCaseProvider } from '@infrastructure/http/use-case.provider';
import { PriceAndNewsController } from './price-and-news.controller';
import { PriceAndNewsService } from './price-and-news.service';
import { UpdateCoffeePriceUseCase } from '@domain/price-and-news/use-cases/update-coffee-price.use-case';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { OwnershipModule } from '@infrastructure/http/ownership.module';

@Module({
  imports: [PersistenceModule, OwnershipModule],
  controllers: [PriceAndNewsController],
  providers: [
    PriceAndNewsService,
    useCaseProvider(UpdateCoffeePriceUseCase, ['COFFEE_PRICE_REPOSITORY', 'NOTIFICATION_REPOSITORY', 'COFFEE_GROWER_REPOSITORY']),
  ],
  exports: [PriceAndNewsService],
})
export class PriceAndNewsModule {}