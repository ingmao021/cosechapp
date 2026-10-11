import { CoffeePriceRepository } from '../coffee-price.repository';
import { NewsArticle, NewsKind } from '../news-article.entity';
import { NewsArticleRepository } from '../news-article.repository';
import { PriceInsight } from '../price-insight.entity';
import { PriceInsightRepository } from '../price-insight.repository';
import { CoffeeIntelPort, FncPriceSource, NewsFeedSource, NewsReport } from '../coffee-intel.port';
import { UpdateCoffeePriceUseCase } from './update-coffee-price.use-case';

/** Rango razonable del precio interno FNC (COP por carga de 125 kg). Fuera de él, se descarta. */
export const FNC_PRICE_MIN = 500_000;
export const FNC_PRICE_MAX = 6_000_000;
/** Un precio publicado hace más de esto ya no es "el de hoy". */
const MAX_PRICE_AGE_DAYS = 3;
const NEWS_MAX_AGE_DAYS = 30;
const MAX_NEWS_PER_RUN = 8;
const HISTORY_FOR_ANALYSIS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type PriceOutcome = 'published' | 'unchanged' | 'rejected' | 'not-found' | 'failed';

export interface RefreshCoffeeIntelOutput {
  /** Hay IA (Gemini) para el análisis y para elegir noticias. */
  aiEnabled: boolean;
  price: { outcome: PriceOutcome; value?: number; reason?: string };
  news: { added: number; pickedBy: 'ai' | 'recency'; error?: string };
  analysis: { outcome: 'generated' | 'up-to-date' | 'no-price' | 'disabled' | 'failed'; error?: string };
}

/**
 * Actualiza Precio y Noticias solo con fuentes gratuitas, validando antes de guardar:
 * - Precio: el publicado en la web de la FNC, dentro de rango y reciente; se publica con
 *   UpdateCoffeePriceUseCase (que crea las notificaciones si cambió).
 * - Noticias: del RSS de Google Noticias (enlaces reales), sin repetir y de los últimos 30 días;
 *   Gemini elige las más útiles para un caficultor y, si no está o falla, se toman las más recientes.
 * - Análisis: Gemini, solo cuando el precio vigente aún no tiene uno.
 * Cada parte falla por su cuenta: si una falla, las demás siguen.
 */
export class RefreshCoffeeIntelUseCase {
  constructor(
    private readonly fncPriceSource: FncPriceSource,
    private readonly newsFeedSource: NewsFeedSource,
    private readonly coffeeIntel: CoffeeIntelPort,
    private readonly coffeePriceRepository: CoffeePriceRepository,
    private readonly newsArticleRepository: NewsArticleRepository,
    private readonly priceInsightRepository: PriceInsightRepository,
    private readonly updateCoffeePriceUseCase: UpdateCoffeePriceUseCase,
  ) {}

  async execute(now: Date = new Date()): Promise<RefreshCoffeeIntelOutput> {
    const [price, news] = await Promise.all([this.refreshPrice(now), this.refreshNews(now)]);
    const analysis = await this.refreshAnalysis();
    return { aiEnabled: this.coffeeIntel.enabled, price, news, analysis };
  }

  private async refreshPrice(now: Date): Promise<RefreshCoffeeIntelOutput['price']> {
    try {
      const report = await this.fncPriceSource.fetchLatest();
      if (!report) return { outcome: 'not-found' };

      const value = Math.round(report.value);
      if (!Number.isFinite(value) || value < FNC_PRICE_MIN || value > FNC_PRICE_MAX) {
        return { outcome: 'rejected', value, reason: 'out of range' };
      }
      const date = parseDay(report.date);
      if (!date || date.getTime() > now.getTime() + DAY_MS || now.getTime() - date.getTime() > MAX_PRICE_AGE_DAYS * DAY_MS) {
        return { outcome: 'rejected', value, reason: `stale or invalid date ${report.date}` };
      }

      const latest = await this.coffeePriceRepository.findLatest();
      const result = await this.updateCoffeePriceUseCase.execute({ value, queryDate: date });
      const published = result.hasChanged || !latest;
      return { outcome: published ? 'published' : 'unchanged', value };
    } catch (error) {
      return { outcome: 'failed', reason: errorMessage(error) };
    }
  }

  private async refreshNews(now: Date): Promise<RefreshCoffeeIntelOutput['news']> {
    let pickedBy: 'ai' | 'recency' = 'recency';
    try {
      const oldest = now.getTime() - NEWS_MAX_AGE_DAYS * DAY_MS;
      const reports = dedupe(await this.newsFeedSource.fetchRecent()).filter(
        (r) => r.publishedAt.getTime() >= oldest && r.publishedAt.getTime() <= now.getTime() + DAY_MS,
      );
      const existing = new Set(await this.newsArticleRepository.findExistingUrls(reports.map((r) => r.url)));
      const candidates = reports.filter((r) => !existing.has(r.url));
      if (candidates.length === 0) return { added: 0, pickedBy };

      let chosen = candidates.slice(0, MAX_NEWS_PER_RUN);
      if (this.coffeeIntel.enabled) {
        try {
          const indexes = await this.coffeeIntel.pickRelevantNews(candidates.map((c) => c.title), MAX_NEWS_PER_RUN);
          const picked = [...new Set(indexes)].filter((i) => Number.isInteger(i) && i >= 0 && i < candidates.length);
          chosen = picked.slice(0, MAX_NEWS_PER_RUN).map((i) => candidates[i]);
          pickedBy = 'ai';
        } catch {
          // Sin IA disponible se quedan las más recientes.
        }
      }

      let added = 0;
      for (const report of chosen) {
        const article = toArticle(report);
        if (!article) continue;
        await this.newsArticleRepository.save(article);
        added++;
      }
      return { added, pickedBy };
    } catch (error) {
      return { added: 0, pickedBy, error: errorMessage(error) };
    }
  }

  private async refreshAnalysis(): Promise<RefreshCoffeeIntelOutput['analysis']> {
    if (!this.coffeeIntel.enabled) return { outcome: 'disabled' };
    try {
      const latestPrice = await this.coffeePriceRepository.findLatest();
      if (!latestPrice) return { outcome: 'no-price' };
      const latestInsight = await this.priceInsightRepository.findLatest();
      if (latestInsight?.coffeePriceId === latestPrice.id) return { outcome: 'up-to-date' };

      const history = (await this.coffeePriceRepository.findAll())
        .slice(0, HISTORY_FOR_ANALYSIS)
        .map((price) => ({ value: price.value, date: price.queryDate }));
      const text = await this.coffeeIntel.analyzePrice(history);
      await this.priceInsightRepository.save(PriceInsight.create(crypto.randomUUID(), text, latestPrice.id));
      return { outcome: 'generated' };
    } catch (error) {
      return { outcome: 'failed', error: errorMessage(error) };
    }
  }
}

/** Google Noticias repite la misma nota con enlaces distintos: se deja una por título. */
function dedupe(reports: NewsReport[]): NewsReport[] {
  const seen = new Set<string>();
  return reports.filter((r) => {
    const key = r.title.toLowerCase();
    if (seen.has(key) || seen.has(r.url)) return false;
    seen.add(key);
    seen.add(r.url);
    return true;
  });
}

function toArticle(report: NewsReport): NewsArticle | null {
  try {
    return NewsArticle.create({
      id: crypto.randomUUID(),
      kind: NewsKind.NEWS,
      title: report.title,
      source: report.source,
      summary: '',
      url: report.url,
      publishedAt: report.publishedAt,
    });
  } catch {
    return null;
  }
}

/** "AAAA-MM-DD" → mediodía de ese día en Colombia (17:00 UTC), para no cambiar de día por zona horaria. */
function parseDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!match) return null;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T17:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
