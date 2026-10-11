import { RefreshCoffeeIntelUseCase } from './refresh-coffee-intel.use-case';
import { UpdateCoffeePriceUseCase } from './update-coffee-price.use-case';
import { CoffeeIntelPort, UrlVerifier } from '../coffee-intel.port';
import { CoffeePriceRepository } from '../coffee-price.repository';
import { NewsArticleRepository } from '../news-article.repository';
import { PriceInsightRepository } from '../price-insight.repository';
import { NotificationRepository } from '../notification.repository';
import { CoffeeGrowerRepository } from '@domain/auth/coffee-grower.repository';
import { CoffeePrice } from '../coffee-price.entity';
import { NewsArticle, NewsKind } from '../news-article.entity';
import { PriceInsight } from '../price-insight.entity';

const NOW = new Date('2026-10-11T15:00:00Z');

describe('RefreshCoffeeIntelUseCase', () => {
  let intel: jest.Mocked<CoffeeIntelPort>;
  let urlVerifier: jest.Mocked<UrlVerifier>;
  let prices: CoffeePrice[];
  let coffeePriceRepository: jest.Mocked<CoffeePriceRepository>;
  let saved: NewsArticle[];
  let newsRepository: jest.Mocked<NewsArticleRepository>;
  let insightRepository: jest.Mocked<PriceInsightRepository>;
  let useCase: RefreshCoffeeIntelUseCase;

  beforeEach(() => {
    intel = {
      enabled: true,
      fetchFncPrice: jest.fn().mockResolvedValue({
        value: 2_850_000,
        date: '2026-10-10',
        sources: ['federaciondecafeteros.org'],
      }),
      fetchNews: jest.fn().mockResolvedValue([]),
      analyzePrice: jest.fn().mockResolvedValue('El precio subió frente a la semana pasada.'),
      monthlyTips: jest.fn().mockResolvedValue([]),
    };
    urlVerifier = { exists: jest.fn().mockResolvedValue(true) };

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
      findTipsByMonth: jest.fn(async (month: string) => saved.filter((a) => a.month === month)),
      findExistingUrls: jest.fn(async (urls: string[]) => saved.map((a) => a.url).filter((u) => urls.includes(u))),
      findLatestNewsCreatedAt: jest.fn(),
    };

    insightRepository = { save: jest.fn(async (insight: PriceInsight) => insight), findLatest: jest.fn().mockResolvedValue(null) };

    const notificationRepository = { save: jest.fn() } as unknown as NotificationRepository;
    const growerRepository = { findAll: jest.fn().mockResolvedValue([]) } as unknown as CoffeeGrowerRepository;
    const updatePrice = new UpdateCoffeePriceUseCase(coffeePriceRepository, notificationRepository, growerRepository);

    useCase = new RefreshCoffeeIntelUseCase(
      intel,
      urlVerifier,
      coffeePriceRepository,
      newsRepository,
      insightRepository,
      updatePrice,
    );
  });

  describe('price', () => {
    it('publishes a valid FNC price and analyzes it', async () => {
      const result = await useCase.execute(NOW);

      expect(result.price).toEqual({ outcome: 'published', value: 2_850_000 });
      expect(prices[0].value).toBe(2_850_000);
      expect(result.analysis.outcome).toBe('generated');
      expect(insightRepository.save).toHaveBeenCalledWith(expect.objectContaining({ coffeePriceId: prices[0].id }));
    });

    it('keeps history: a changed price is a new row', async () => {
      await useCase.execute(NOW);
      intel.fetchFncPrice.mockResolvedValue({ value: 2_900_000, date: '2026-10-11', sources: ['https://federaciondecafeteros.org/'] });

      const result = await useCase.execute(NOW);

      expect(result.price.outcome).toBe('published');
      expect(prices.map((p) => p.value)).toEqual([2_900_000, 2_850_000]);
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
      ['out of range', { value: 28_500, date: '2026-10-10', sources: ['federaciondecafeteros.org'] }],
      ['stale', { value: 2_850_000, date: '2026-09-20', sources: ['federaciondecafeteros.org'] }],
      ['in the future', { value: 2_850_000, date: '2026-10-20', sources: ['federaciondecafeteros.org'] }],
      ['not from FNC', { value: 2_850_000, date: '2026-10-10', sources: ['blogcafetero.com'] }],
    ])('rejects a price that is %s', async (_label, report) => {
      intel.fetchFncPrice.mockResolvedValue(report);

      const result = await useCase.execute(NOW);

      expect(result.price.outcome).toBe('rejected');
      expect(prices).toHaveLength(0);
      expect(result.analysis.outcome).toBe('no-price');
    });
  });

  describe('news', () => {
    const report = (url: string, publishedAt = '2026-10-09') => ({
      title: `Noticia ${url}`,
      source: 'FNC',
      summary: 'Resumen corto.',
      url,
      publishedAt,
    });

    it('saves verified, recent, new articles and rejects the rest', async () => {
      saved.push(
        NewsArticle.create({
          id: 'old',
          kind: NewsKind.NEWS,
          title: 'Ya guardada',
          source: 'FNC',
          summary: 'x',
          url: 'https://a.co/repetida',
          publishedAt: NOW,
        }),
      );
      intel.fetchNews.mockResolvedValue([
        report('https://a.co/buena'),
        report('https://a.co/repetida'),
        report('https://a.co/vieja', '2026-08-01'),
        report('https://a.co/inventada'),
      ]);
      urlVerifier.exists.mockImplementation(async (url) => !url.includes('inventada'));

      const result = await useCase.execute(NOW);

      expect(result.news).toEqual({ added: 1, rejected: 3 });
      expect(saved.filter((a) => a.kind === NewsKind.NEWS).map((a) => a.url)).toEqual([
        'https://a.co/repetida',
        'https://a.co/buena',
      ]);
    });
  });

  describe('tips', () => {
    it('generates tips once per month', async () => {
      intel.monthlyTips.mockResolvedValue([
        { title: 'Manejo de broca', summary: 'Recoja los granos caídos.', source: 'Cenicafé', url: 'https://cenicafe.org/1' },
      ]);

      const first = await useCase.execute(NOW);
      const second = await useCase.execute(NOW);

      expect(first.tips).toEqual({ added: 1, month: '2026-10' });
      expect(second.tips).toEqual({ added: 0, month: '2026-10', existing: true });
      expect(intel.monthlyTips).toHaveBeenCalledTimes(1);
    });
  });

  it('isolates failures: news failing does not stop price nor tips', async () => {
    intel.fetchNews.mockRejectedValue(new Error('quota exceeded'));
    intel.monthlyTips.mockResolvedValue([
      { title: 'Fertilización', summary: 'Según análisis de suelo.', source: 'Cenicafé', url: 'https://cenicafe.org/2' },
    ]);

    const result = await useCase.execute(NOW);

    expect(result.news.error).toBe('quota exceeded');
    expect(result.price.outcome).toBe('published');
    expect(result.tips.added).toBe(1);
  });

  it('does nothing when AI is disabled', async () => {
    (intel as { enabled: boolean }).enabled = false;

    const result = await useCase.execute(NOW);

    expect(result.enabled).toBe(false);
    expect(intel.fetchFncPrice).not.toHaveBeenCalled();
    expect(coffeePriceRepository.save).not.toHaveBeenCalled();
  });
});
