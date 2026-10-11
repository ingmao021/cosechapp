import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoffeePrice } from '@domain/price-and-news/coffee-price.entity';
import { Notification } from '@domain/price-and-news/notification.entity';
import { CoffeePriceRepository } from '@domain/price-and-news/coffee-price.repository';
import { NotificationRepository } from '@domain/price-and-news/notification.repository';
import { UpdateCoffeePriceUseCase } from '@domain/price-and-news/use-cases/update-coffee-price.use-case';
import { NewsArticle } from '@domain/price-and-news/news-article.entity';
import { NewsArticleRepository } from '@domain/price-and-news/news-article.repository';
import { PriceInsight } from '@domain/price-and-news/price-insight.entity';
import { PriceInsightRepository } from '@domain/price-and-news/price-insight.repository';
import {
  RefreshCoffeeIntelOutput,
  RefreshCoffeeIntelUseCase,
} from '@domain/price-and-news/use-cases/refresh-coffee-intel.use-case';
import { ResourceNotFoundError } from '@shared/errors/domain-errors';

const NEWS_WINDOW_DAYS = 30;
const NEWS_LIMIT = 20;
const DEFAULT_STALE_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;

export interface NotificationWithPrice {
  notification: Notification;
  /** Precio FNC vigente cuando se creó la notificación. */
  priceValue: number | null;
}

@Injectable()
export class PriceAndNewsService {
  private readonly logger = new Logger(PriceAndNewsService.name);
  private readonly staleMs: number;
  /** Refresh con IA en curso: nunca corren dos a la vez. */
  private running: Promise<RefreshCoffeeIntelOutput> | null = null;
  private lastRunAt: Date | null = null;

  constructor(
    @Inject('COFFEE_PRICE_REPOSITORY') private readonly coffeePriceRepository: CoffeePriceRepository,
    @Inject('NOTIFICATION_REPOSITORY') private readonly notificationRepository: NotificationRepository,
    @Inject('NEWS_ARTICLE_REPOSITORY') private readonly newsArticleRepository: NewsArticleRepository,
    @Inject('PRICE_INSIGHT_REPOSITORY') private readonly priceInsightRepository: PriceInsightRepository,
    private readonly updateCoffeePriceUseCase: UpdateCoffeePriceUseCase,
    private readonly refreshCoffeeIntelUseCase: RefreshCoffeeIntelUseCase,
    configService: ConfigService,
  ) {
    const hours = Number(configService.get<string>('COFFEE_INTEL_STALE_HOURS'));
    this.staleMs = (Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_STALE_HOURS) * HOUR_MS;
  }

  /** Precio FNC, noticias y análisis del precio (lo llama el job diario con x-admin-key). */
  refreshCoffeeIntel(): Promise<RefreshCoffeeIntelOutput> {
    if (!this.running) {
      this.running = this.refreshCoffeeIntelUseCase
        .execute()
        .then((result) => {
          this.lastRunAt = new Date();
          this.logger.log(`Coffee intel refresh: ${JSON.stringify(result)}`);
          return result;
        })
        .finally(() => (this.running = null));
    }
    return this.running;
  }

  /**
   * Respaldo del job diario (en el plan free el servidor se duerme): si los datos tienen más de
   * COFFEE_INTEL_STALE_HOURS, se refresca en segundo plano. Quien lee recibe lo guardado sin esperar.
   */
  refreshIfStale(): void {
    if (this.running) return;
    void this.isStale()
      .then((stale) => (stale ? this.refreshCoffeeIntel() : undefined))
      .catch((error) => this.logger.error(`Background coffee intel refresh failed: ${error}`));
  }

  private async isStale(): Promise<boolean> {
    // Tras un reinicio no hay lastRunAt en memoria: se usa la última noticia guardada.
    this.lastRunAt ??= await this.newsArticleRepository.findLatestNewsCreatedAt();
    return !this.lastRunAt || Date.now() - this.lastRunAt.getTime() > this.staleMs;
  }

  async getNews(): Promise<NewsArticle[]> {
    return this.newsArticleRepository.findRecentNews(new Date(Date.now() - NEWS_WINDOW_DAYS * 24 * HOUR_MS), NEWS_LIMIT);
  }

  /** Análisis del precio vigente; si el precio cambió y aún no se analizó, no hay (null). */
  async getPriceAnalysis(): Promise<PriceInsight | null> {
    const [latestPrice, insight] = await Promise.all([
      this.coffeePriceRepository.findLatest(),
      this.priceInsightRepository.findLatest(),
    ]);
    return latestPrice && insight?.coffeePriceId === latestPrice.id ? insight : null;
  }

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