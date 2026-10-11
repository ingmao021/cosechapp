import { CoffeePriceRepository } from '../coffee-price.repository';
import { NewsArticle, NewsKind } from '../news-article.entity';
import { NewsArticleRepository } from '../news-article.repository';
import { PriceInsight } from '../price-insight.entity';
import { PriceInsightRepository } from '../price-insight.repository';
import { CoffeeIntelPort, NewsReport, TipReport, UrlVerifier } from '../coffee-intel.port';
import { UpdateCoffeePriceUseCase } from './update-coffee-price.use-case';
import { monthInColombia } from '@shared/time/colombia-time';

/** Rango razonable del precio interno FNC (COP por carga de 125 kg). Fuera de él, se descarta. */
export const FNC_PRICE_MIN = 500_000;
export const FNC_PRICE_MAX = 6_000_000;
/** Un precio publicado hace más de esto ya no es "el de hoy". */
const MAX_PRICE_AGE_DAYS = 3;
const NEWS_MAX_AGE_DAYS = 30;
const MAX_NEWS_PER_RUN = 8;
const MAX_TIPS = 4;
const HISTORY_FOR_ANALYSIS = 30;
const FNC_DOMAIN = 'federaciondecafeteros.org';
const DAY_MS = 24 * 60 * 60 * 1000;

export type PriceOutcome = 'published' | 'unchanged' | 'rejected' | 'not-found' | 'failed';

export interface RefreshCoffeeIntelOutput {
  enabled: boolean;
  price: { outcome: PriceOutcome; value?: number; reason?: string };
  news: { added: number; rejected: number; error?: string };
  analysis: { outcome: 'generated' | 'up-to-date' | 'no-price' | 'failed'; error?: string };
  tips: { added: number; month: string; existing?: boolean; error?: string };
}

/**
 * Actualiza precio FNC, noticias, análisis y tips con la IA, validando todo antes de guardarlo:
 * - Precio: dentro de rango, reciente y citado de federaciondecafeteros.org; se publica con
 *   UpdateCoffeePriceUseCase (que crea las notificaciones si cambió).
 * - Noticias y tips: url que exista de verdad, sin repetir, noticias de los últimos 30 días.
 * - Análisis: solo cuando el precio vigente aún no tiene uno.
 * Cada parte falla por su cuenta: si una falla, las demás siguen.
 */
export class RefreshCoffeeIntelUseCase {
  constructor(
    private readonly coffeeIntel: CoffeeIntelPort,
    private readonly urlVerifier: UrlVerifier,
    private readonly coffeePriceRepository: CoffeePriceRepository,
    private readonly newsArticleRepository: NewsArticleRepository,
    private readonly priceInsightRepository: PriceInsightRepository,
    private readonly updateCoffeePriceUseCase: UpdateCoffeePriceUseCase,
  ) {}

  async execute(now: Date = new Date()): Promise<RefreshCoffeeIntelOutput> {
    const month = monthInColombia(now);
    if (!this.coffeeIntel.enabled) {
      return {
        enabled: false,
        price: { outcome: 'not-found', reason: 'AI disabled' },
        news: { added: 0, rejected: 0 },
        analysis: { outcome: 'no-price' },
        tips: { added: 0, month },
      };
    }

    const price = await this.refreshPrice(now);
    const [news, tips] = await Promise.all([this.refreshNews(now), this.refreshTips(month)]);
    const analysis = await this.refreshAnalysis();
    return { enabled: true, price, news, analysis, tips };
  }

  private async refreshPrice(now: Date): Promise<RefreshCoffeeIntelOutput['price']> {
    try {
      const report = await this.coffeeIntel.fetchFncPrice();
      if (!report) return { outcome: 'not-found' };

      const value = Math.round(report.value);
      if (!Number.isFinite(value) || value < FNC_PRICE_MIN || value > FNC_PRICE_MAX) {
        return { outcome: 'rejected', value, reason: 'out of range' };
      }
      const date = parseDay(report.date);
      if (!date || date.getTime() > now.getTime() + DAY_MS || now.getTime() - date.getTime() > MAX_PRICE_AGE_DAYS * DAY_MS) {
        return { outcome: 'rejected', value, reason: `stale or invalid date ${report.date}` };
      }
      if (!report.sources.some((source) => source.toLowerCase().includes(FNC_DOMAIN))) {
        return { outcome: 'rejected', value, reason: 'not sourced from FNC' };
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
    try {
      const reports = await this.coffeeIntel.fetchNews();
      const oldest = now.getTime() - NEWS_MAX_AGE_DAYS * DAY_MS;
      const existing = new Set(await this.newsArticleRepository.findExistingUrls(reports.map((r) => r.url)));

      let added = 0;
      let rejected = 0;
      for (const report of reports) {
        if (added >= MAX_NEWS_PER_RUN) break;
        const publishedAt = parseDay(report.publishedAt);
        const fresh = publishedAt && publishedAt.getTime() >= oldest && publishedAt.getTime() <= now.getTime() + DAY_MS;
        if (!fresh || existing.has(report.url) || !(await this.urlVerifier.exists(report.url))) {
          rejected++;
          continue;
        }
        const article = tryCreate(() => toArticle(report, NewsKind.NEWS, publishedAt, null));
        if (!article) {
          rejected++;
          continue;
        }
        await this.newsArticleRepository.save(article);
        existing.add(report.url);
        added++;
      }
      return { added, rejected };
    } catch (error) {
      return { added: 0, rejected: 0, error: errorMessage(error) };
    }
  }

  private async refreshTips(month: string): Promise<RefreshCoffeeIntelOutput['tips']> {
    try {
      if ((await this.newsArticleRepository.findTipsByMonth(month)).length > 0) {
        return { added: 0, month, existing: true };
      }
      const reports = await this.coffeeIntel.monthlyTips(month);
      const seen = new Set<string>();
      let added = 0;
      for (const report of reports) {
        if (added >= MAX_TIPS) break;
        if (seen.has(report.title) || !(await this.urlVerifier.exists(report.url))) continue;
        const article = tryCreate(() => toArticle(report, NewsKind.TIP, new Date(), month));
        if (!article) continue;
        await this.newsArticleRepository.save(article);
        seen.add(report.title);
        added++;
      }
      return { added, month };
    } catch (error) {
      return { added: 0, month, error: errorMessage(error) };
    }
  }

  private async refreshAnalysis(): Promise<RefreshCoffeeIntelOutput['analysis']> {
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

function toArticle(report: NewsReport | TipReport, kind: NewsKind, publishedAt: Date, month: string | null): NewsArticle {
  return NewsArticle.create({
    id: crypto.randomUUID(),
    kind,
    title: report.title,
    source: report.source,
    summary: report.summary,
    url: report.url,
    publishedAt,
    month,
  });
}

function tryCreate(create: () => NewsArticle): NewsArticle | null {
  try {
    return create();
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
