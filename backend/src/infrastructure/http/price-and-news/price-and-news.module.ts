import { Module } from '@nestjs/common';
import { PriceAndNewsController } from './price-and-news.controller';
import { PriceAndNewsService } from './price-and-news.service';
import { UpdateCoffeePriceUseCase } from '@domain/price-and-news/use-cases/update-coffee-price.use-case';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [PriceAndNewsController],
  providers: [PriceAndNewsService, UpdateCoffeePriceUseCase],
  exports: [PriceAndNewsService],
})
export class PriceAndNewsModule {}