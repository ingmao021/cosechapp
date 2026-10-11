import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { PriceAndNewsFacade } from './price-and-news.facade';
import { PriceAndNewsService, NewsItem } from './price-and-news.service';

const news: NewsItem = {
  id: 'n1',
  kind: 'NEWS',
  title: 'Sube el precio interno',
  source: 'FNC',
  summary: 'Resumen.',
  url: 'https://federaciondecafeteros.org/n1',
  publishedAt: '2026-10-10T17:00:00Z',
};
const tip: NewsItem = { ...news, id: 't1', kind: 'TIP', title: 'Manejo de broca', source: 'Cenicafé' };
const price = { id: 'p1', value: 2_850_000, queryDate: '2026-10-10T17:00:00Z', createdAt: '2026-10-10T17:00:00Z' };
const analysis = { text: 'El precio subió.', generatedAt: '2026-10-10T18:00:00Z', basedOnPriceId: 'p1' };

describe('PriceAndNewsFacade', () => {
  let facade: PriceAndNewsFacade;
  const service = {
    getLatestCoffeePrice: vi.fn(),
    getPriceAnalysis: vi.fn(),
    getNews: vi.fn(),
    getTips: vi.fn(),
    getNotifications: vi.fn(),
  };
  const offline = () => throwError(() => new HttpErrorResponse({ status: 0 }));

  function online() {
    service.getLatestCoffeePrice.mockReturnValue(of(price));
    service.getPriceAnalysis.mockReturnValue(of(analysis));
    service.getNews.mockReturnValue(of([news]));
    service.getTips.mockReturnValue(of([tip]));
    service.getNotifications.mockReturnValue(of([]));
  }

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: PriceAndNewsService, useValue: service }] });
    facade = TestBed.inject(PriceAndNewsFacade);
  });

  it('loads price, analysis, news and tips', async () => {
    online();

    await facade.loadAll();

    expect(facade.formattedPrice()).toContain('2.850.000');
    expect(facade.analysis()?.text).toBe('El precio subió.');
    expect(facade.news()).toEqual([news]);
    expect(facade.tips()).toEqual([tip]);
    expect(facade.isOfflineData()).toBe(false);
  });

  it('shows the last saved data when there is no signal', async () => {
    online();
    await facade.loadAll();

    // Otra sesión de la app, ya sin señal
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PriceAndNewsService, useValue: service }] });
    const offlineFacade = TestBed.inject(PriceAndNewsFacade);
    service.getLatestCoffeePrice.mockReturnValue(offline());
    service.getPriceAnalysis.mockReturnValue(offline());
    service.getNews.mockReturnValue(offline());
    service.getTips.mockReturnValue(offline());
    service.getNotifications.mockReturnValue(offline());

    await offlineFacade.loadAll();

    expect(offlineFacade.isOfflineData()).toBe(true);
    expect(offlineFacade.news()).toEqual([news]);
    expect(offlineFacade.analysis()?.basedOnPriceId).toBe('p1');
    expect(offlineFacade.error()).toBeNull();
  });

  it('keeps loading until every request finishes', async () => {
    online();
    const notifications = new Subject<never[]>();
    service.getNotifications.mockReturnValue(notifications);

    const loading = facade.loadAll();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve));

    expect(facade.news()).toEqual([news]);
    expect(facade.isLoading()).toBe(true);

    notifications.next([]);
    notifications.complete();
    await loading;
    expect(facade.isLoading()).toBe(false);
  });
});
