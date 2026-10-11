import { Module } from '@nestjs/common';
import { useCaseProvider } from '@infrastructure/http/use-case.provider';
import { PriceAndNewsController } from './price-and-news.controller';
import { PriceAndNewsService } from './price-and-news.service';
import { UpdateCoffeePriceUseCase } from '@domain/price-and-news/use-cases/update-coffee-price.use-case';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { OwnershipModule } from '@infrastructure/http/ownership.module';
import { AiModule } from '@infrastructure/ai/ai.module';
import { RefreshCoffeeIntelUseCase } from '@domain/price-and-news/use-cases/refresh-coffee-intel.use-case';

@Module({
  imports: [PersistenceModule, OwnershipModule, AiModule],
  controllers: [PriceAndNewsController],
  providers: [
    PriceAndNewsService,
    useCaseProvider(UpdateCoffeePriceUseCase, ['COFFEE_PRICE_REPOSITORY', 'NOTIFICATION_REPOSITORY', 'COFFEE_GROWER_REPOSITORY']),
    useCaseProvider(RefreshCoffeeIntelUseCase, [
      'COFFEE_INTEL_PORT',
      'URL_VERIFIER',
      'COFFEE_PRICE_REPOSITORY',
      'NEWS_ARTICLE_REPOSITORY',
      'PRICE_INSIGHT_REPOSITORY',
      UpdateCoffeePriceUseCase,
    ]),
  ],
  exports: [PriceAndNewsService],
})
export class PriceAndNewsModule {}