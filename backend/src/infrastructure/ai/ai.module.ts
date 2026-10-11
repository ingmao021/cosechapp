import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoffeeIntelPort } from '@domain/price-and-news/coffee-intel.port';
import { GeminiCoffeeIntelAdapter } from './gemini-coffee-intel.adapter';
import { DEFAULT_FNC_PRICE_URL, FncWebPriceSource } from './fnc-web-price.source';
import { GoogleNewsFeedSource } from './google-news-feed.source';

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Sin GEMINI_API_KEY no hay IA: el precio FNC y las noticias igual se actualizan (no la usan),
 * pero no hay análisis del precio y las noticias se eligen por fecha.
 */
const disabledCoffeeIntel: CoffeeIntelPort = {
  enabled: false,
  analyzePrice: async () => {
    throw new Error('AI disabled');
  },
  pickRelevantNews: async () => {
    throw new Error('AI disabled');
  },
};

/** Fuentes gratuitas de Precio y Noticias: web de la FNC, RSS de Google Noticias y Gemini sin búsqueda. */
@Module({
  providers: [
    {
      provide: 'COFFEE_INTEL_PORT',
      inject: [ConfigService],
      useFactory: (config: ConfigService): CoffeeIntelPort => {
        const apiKey = config.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
          new Logger('AiModule').warn('GEMINI_API_KEY is not set: no price analysis, news picked by date');
          return disabledCoffeeIntel;
        }
        return new GeminiCoffeeIntelAdapter(apiKey, config.get<string>('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL);
      },
    },
    {
      provide: 'FNC_PRICE_SOURCE',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new FncWebPriceSource(config.get<string>('FNC_PRICE_URL') || DEFAULT_FNC_PRICE_URL),
    },
    { provide: 'NEWS_FEED_SOURCE', useFactory: () => new GoogleNewsFeedSource() },
  ],
  exports: ['COFFEE_INTEL_PORT', 'FNC_PRICE_SOURCE', 'NEWS_FEED_SOURCE'],
})
export class AiModule {}
