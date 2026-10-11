import { RefreshCoffeeIntelUseCase } from './refresh-coffee-intel.use-case';
import { UpdateCoffeePriceUseCase } from './update-coffee-price.use-case';
import { CoffeeIntelPort, FncPriceSource, NewsFeedSource, NewsReport } from '../coffee-intel.port';
import { CoffeePriceRepository } from '../coffee-price.repository';
import { NewsArticleRepository } from '../news-article.repository';
import { PriceInsightRepository } from '../price-insight.repository';
import { NotificationRepository } from '../notification.repository';
import { CoffeeGrowerRepository } from '@domain/auth/coffee-grower.repository';
import { CoffeePrice } from '../coffee-price.entity';
import { NewsArticle, NewsKind } from '../news-article.entity';
import { PriceInsight } from '../price-insight.entity';

const NOW = new Date('2026-10-11T15:00:00Z');

const report = (n: number, publishedAt = '2026-10-09T12:00:00Z'): NewsReport => ({
  title: `Noticia ${n}`,
  source: 'Caracol Radio',
  url: `https://news.google.com/rss/articles/${n}`,
  publishedAt: new Date(publishedAt),
});

describe('RefreshCoffeeIntelUseCase', () => {
  let fnc: jest.Mocked<FncPriceSource>;
  let feed: jest.Mocked<NewsFeedSource>;
  let intel: jest.Mocked<CoffeeIntelPort>;
  let prices: CoffeePrice[];
  let coffeePriceRepository: jest.Mocked<CoffeePriceRepository>;
  let saved: NewsArticle[];
  let newsRepository: jest.Mocked<NewsArticleRepository>;
  let insightRepository: jest.Mocked<PriceInsightRepository>;
  let useCase: RefreshCoffeeIntelUseCase;

  beforeEach(() => {
    fnc = { fetchLatest: jest.fn().mockResolvedValue({ value: 2_055_000, date: '2026-10-09' }) };
    feed = { fetchRecent: jest.fn().mockResolvedValue([]) };
    intel = {
      enabled: true,
      analyzePrice: jest.fn().mockResolvedValue('El precio se mantiene.'),
      pickRelevantNews: jest.fn().mockResolvedValue([]),
    };

    prices = [];
    coffeePriceRepository = {
      save: jest.fn(async (price: CoffeePrice) => {
        prices = [price, ...prices.filter((p) => p.id !== price.id)];
        return price;
      }),
      findLatest: jest.fn(async () => prices[0] ?? null),
      findAll: jest.fn(async () => prices),
      findByDateRange: jest.fn(),
    };

    saved = [];
    newsRepository = {
      save: jest.fn(async (article: NewsArticle) => {
        saved.push(article);
        return article;
      }),
      findRecentNews: jest.fn(),
      findExistingUrls: jest.fn(async (urls: string[]) => saved.map((a) => a.url).filter((u) => urls.includes(u))),
      findLatestNewsCreatedAt: jest.fn(),
    };

    insightRepository = { save: jest.fn(async (insight: PriceInsight) => insight), findLatest: jest.fn().mockResolvedValue(null) };

    const notificationRepository = { save: jest.fn() } as unknown as NotificationRepository;
    const growerRepository = { findAll: jest.fn().mockResolvedValue([]) } as unknown as CoffeeGrowerRepository;
    const updatePrice = new UpdateCoffeePriceUseCase(coffeePriceRepository, notificationRepository, growerRepository);

    useCase = new RefreshCoffeeIntelUseCase(
      fnc,
      feed,
      intel,
      coffeePriceRepository,
      newsRepository,
      insightRepository,
      updatePrice,
    );
  });

  describe('price', () => {
    it('publishes the FNC price and analyzes it', async () => {
      const result = await useCase.execute(NOW);

      expect(result.price).toEqual({ outcome: 'published', value: 2_055_000 });
      expect(prices[0].value).toBe(2_055_000);
      expect(result.analysis.outcome).toBe('generated');
      expect(insightRepository.save).toHaveBeenCalledWith(expect.objectContaining({ coffeePriceId: prices[0].id }));
    });

    it('keeps history: a changed price is a new row', async () => {
      await useCase.execute(NOW);
      fnc.fetchLatest.mockResolvedValue({ value: 2_100_000, date: '2026-10-11' });

      const result = await useCase.execute(NOW);

      expect(result.price.outcome).toBe('published');
      expect(prices.map((p) => p.value)).toEqual([2_100_000, 2_055_000]);
    });

    it('reports unchanged and does not re-analyze the same price', async () => {
      await useCase.execute(NOW);
      insightRepository.findLatest.mockResolvedValue(PriceInsight.create('i1', 'texto', prices[0].id));

      const result = await useCase.execute(NOW);

      expect(result.price.outcome).toBe('unchanged');
      expect(result.analysis.outcome).toBe('up-to-date');
      expect(intel.analyzePrice).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['out of range', { value: 20_550, date: '2026-10-09' }],
      ['stale', { value: 2_055_000, date: '2026-09-20' }],
      ['in the future', { value: 2_055_000, date: '2026-10-20' }],
    ])('rejects a price that is %s', async (_label, fncReport) => {
      fnc.fetchLatest.mockResolvedValue(fncReport);

      const result = await useCase.execute(NOW);

      expect(result.price.outcome).toBe('rejected');
      expect(prices).toHaveLength(0);
      expect(result.analysis.outcome).toBe('no-price');
    });

    it('reports not-found when the FNC page changed', async () => {
      fnc.fetchLatest.mockResolvedValue(null);

      expect((await useCase.execute(NOW)).price.outcome).toBe('not-found');
    });
  });

  describe('news', () => {
    it('saves the news Gemini picks, in its order, without a made-up summary', async () => {
      feed.fetchRecent.mockResolvedValue([report(1), report(2), report(3)]);
      intel.pickRelevantNews.mockResolvedValue([2, 0, 2, 9]);

      const result = await useCase.execute(NOW);

      expect(result.news).toEqual({ added: 2, pickedBy: 'ai' });
      expect(saved.map((a) => a.title)).toEqual(['Noticia 3', 'Noticia 1']);
      expect(saved[0]).toMatchObject({ kind: NewsKind.NEWS, summary: '', source: 'Caracol Radio' });
    });

    it('skips old, repeated and already saved news before asking Gemini', async () => {
      saved.push(
        NewsArticle.create({
          id: 'old',
          kind: NewsKind.NEWS,
          title: 'Ya guardada',
          source: 'FNC',
          summary: '',
          url: report(1).url,
          publishedAt: NOW,
        }),
      );
      feed.fetchRecent.mockResolvedValue([report(1), report(2), { ...report(4), title: 'Noticia 2' }, report(3, '2026-08-01T00:00:00Z')]);
      intel.pickRelevantNews.mockImplementation(async (titles) => titles.map((_, i) => i));

      await useCase.execute(NOW);

      expect(intel.pickRelevantNews).toHaveBeenCalledWith(['Noticia 2'], 8);
    });

    it('falls back to the most recent news when Gemini fails', async () => {
      feed.fetchRecent.mockResolvedValue(Array.from({ length: 10 }, (_, i) => report(i)));
      intel.pickRelevantNews.mockRejectedValue(new Error('429 quota'));

      const result = await useCase.execute(NOW);

      expect(result.news).toEqual({ added: 8, pickedBy: 'recency' });
    });
  });

  it('isolates failures: the news feed failing does not stop the price', async () => {
    feed.fetchRecent.mockRejectedValue(new Error('Google News responded 503'));

    const result = await useCase.execute(NOW);

    expect(result.news.error).toBe('Google News responded 503');
    expect(result.price.outcome).toBe('published');
  });

  it('without AI still updates price and news, but skips the analysis', async () => {
    (intel as { enabled: boolean }).enabled = false;
    feed.fetchRecent.mockResolvedValue([report(1)]);

    const result = await useCase.execute(NOW);

    expect(result.aiEnabled).toBe(false);
    expect(result.price.outcome).toBe('published');
    expect(result.news).toEqual({ added: 1, pickedBy: 'recency' });
    expect(result.analysis.outcome).toBe('disabled');
    expect(intel.pickRelevantNews).not.toHaveBeenCalled();
  });
});
