import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoffeeIntelPort } from '@domain/price-and-news/coffee-intel.port';
import { GeminiCoffeeIntelAdapter } from './gemini-coffee-intel.adapter';
import { HttpUrlVerifier } from './http-url-verifier';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/** Sin GEMINI_API_KEY la IA queda apagada: los refresh no hacen nada y la app muestra lo guardado. */
const disabledCoffeeIntel: CoffeeIntelPort = {
  enabled: false,
  fetchFncPrice: async () => null,
  fetchNews: async () => [],
  analyzePrice: async () => {
    throw new Error('AI disabled');
  },
  monthlyTips: async () => [],
};

@Module({
  providers: [
    {
      provide: 'COFFEE_INTEL_PORT',
      inject: [ConfigService],
      useFactory: (config: ConfigService): CoffeeIntelPort => {
        const apiKey = config.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
          new Logger('AiModule').warn('GEMINI_API_KEY is not set: AI price/news refresh is disabled');
          return disabledCoffeeIntel;
        }
        return new GeminiCoffeeIntelAdapter(apiKey, config.get<string>('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL);
      },
    },
    { provide: 'URL_VERIFIER', useClass: HttpUrlVerifier },
  ],
  exports: ['COFFEE_INTEL_PORT', 'URL_VERIFIER'],
})
export class AiModule {}
