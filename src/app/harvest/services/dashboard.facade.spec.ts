import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DashboardFacade } from './dashboard.facade';
import { HarvestFacade } from './harvest.facade';
import { HarvestDashboardResponse, HarvestResponse, HarvestService, PickerStatsResponse } from './harvest.service';
import { PriceAndNewsFacade } from '@price-and-news/services/price-and-news.facade';
import { SyncFacade } from '../../sync/services/sync.facade';
import { OfflineStore } from '../../sync/services/offline-store';

// Lunes 26 oct 2026, 10:00 en Colombia.
const NOW = new Date('2026-10-26T15:00:00Z');

const harvest: HarvestResponse = {
  id: 'h1',
  name: 'Mitaca',
  pricePerKilogram: 1000,
  status: 'active',
  openingDate: '2026-10-22T14:00:00Z', // jueves 22 en Colombia
  closingDate: null,
  createdAt: '2026-10-22T14:00:00Z',
  updatedAt: '2026-10-22T14:00:00Z',
};

const picker = (overrides: Partial<PickerStatsResponse>): PickerStatsResponse => ({
  id: 'p',
  harvestId: 'h1',
  workerId: 'w',
  crewId: null,
  status: 'active',
  firstName: '',
  lastName: '',
  alias: null,
  displayName: '',
  todayKilograms: 0,
  weekKilograms: 0,
  totalKilograms: 0,
  totalPaid: 0,
  totalMealDeductions: 0,
  balanceDue: 0,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const pickers = [
  picker({ id: 'p1', displayName: 'Juancho', todayKilograms: 30, totalKilograms: 100, totalPaid: 20000, balanceDue: 80000 }),
  picker({ id: 'p2', displayName: 'Ana', todayKilograms: 10, totalKilograms: 50, balanceDue: 50000 }),
  picker({ id: 'p3', displayName: 'Luis', status: 'archived', totalKilograms: 20, totalPaid: 20000 }),
];

const dashboard: HarvestDashboardResponse = {
  dailyKilograms: [
    { date: '2026-10-20', kilograms: 0 },
    { date: '2026-10-21', kilograms: 0 },
    { date: '2026-10-22', kilograms: 12 },
    { date: '2026-10-23', kilograms: 40 },
    { date: '2026-10-24', kilograms: 0 },
    { date: '2026-10-25', kilograms: 25 },
    { date: '2026-10-26', kilograms: 35 },
  ],
  recentActivity: [
    { type: 'payment', id: 'pay1', pickerId: 'p1', displayName: 'Juancho', amount: 20000, mealDeduction: 0, isSettlement: false, dateTime: '2026-10-26T13:00:00Z' },
    { type: 'weighing', id: 'w1', pickerId: 'p2', displayName: 'Ana', kilograms: 10, dateTime: '2026-10-26T12:00:00Z' },
  ],
  productionCosts: 0,
};

describe('DashboardFacade', () => {
  let facade: DashboardFacade;
  let store: OfflineStore;
  const service = { getDashboard: vi.fn() };
  const coffeePrice = signal<{ value: number; queryDate: string } | null>(null);
  const pendingCount = signal(0);
  const activeHarvest = signal<HarvestResponse | null>(harvest);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    vi.clearAllMocks();
    coffeePrice.set({ value: 2_500_000, queryDate: '2026-10-26T12:00:00Z' });
    pendingCount.set(0);
    activeHarvest.set(harvest);
    service.getDashboard.mockReturnValue(of(dashboard));

    TestBed.configureTestingModule({
      providers: [
        { provide: HarvestService, useValue: service },
        { provide: HarvestFacade, useValue: { activeHarvest, activeHarvestPickers: signal(pickers) } },
        { provide: PriceAndNewsFacade, useValue: { coffeePrice } },
        { provide: SyncFacade, useValue: { pendingCount } },
      ],
    });
    facade = TestBed.inject(DashboardFacade);
    store = TestBed.inject(OfflineStore);
  });

  afterEach(() => vi.useRealTimers());

  it('counts the day of the harvest from the opening date, in Colombia', () => {
    expect(facade.harvestDay()).toBe(5);
  });

  it('compares today (from the pickers, including unsent weighings) with yesterday', async () => {
    expect(facade.yesterdayKilograms()).toBeNull(); // sin datos del servidor todavía

    await facade.load();

    expect(service.getDashboard).toHaveBeenCalledWith('h1');
    expect(facade.todayKilograms()).toBe(40);
    expect(facade.yesterdayKilograms()).toBe(25);
  });

  it('builds the 7-day series ending today, without bars before the harvest opened', async () => {
    await facade.load();

    const series = facade.dailySeries();
    expect(series.map((day) => day.date)).toEqual([
      '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26',
    ]);
    expect(series.map((day) => day.inHarvest)).toEqual([false, false, true, true, true, true, true]);
    expect(series[6].kilograms).toBe(40);
    expect(series[3].kilograms).toBe(40);
  });

  it('lists who has a balance, the largest first, and adds it up', () => {
    expect(facade.pendingPickers().map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(facade.pendingTotal()).toBe(130000);
  });

  it('estimates value and profit with the FNC price: cherry ÷ 5 × price per dry kilo', async () => {
    await facade.load();

    expect(facade.totalKilograms()).toBe(170);
    expect(facade.totalPaid()).toBe(40000);
    expect(facade.projectedDryKilograms()).toBe(34);
    // 34 kg secos × (2.500.000 ÷ 125) = 680.000
    expect(facade.estimatedValue()).toBe(680000);
    // 680.000 − (40.000 pagado + 130.000 por pagar)
    expect(facade.estimatedGrossProfit()).toBe(510000);
    expect(facade.estimatedHarvestProfit()).toBe(510000);
  });

  it('subtracts production costs from the harvest profit', async () => {
    service.getDashboard.mockReturnValue(of({ ...dashboard, productionCosts: 10000 }));
    await facade.load();

    expect(facade.estimatedHarvestProfit()).toBe(500000);
  });

  it('never estimates without an FNC price', () => {
    coffeePrice.set(null);

    expect(facade.estimatedValue()).toBeNull();
    expect(facade.estimatedGrossProfit()).toBeNull();
    expect(facade.estimatedHarvestProfit()).toBeNull();
  });

  it('puts weighings still on the phone first in the activity, marked as pending', async () => {
    await facade.load();
    store.enqueueWeighing({ id: 'q1', harvestPickerId: 'p2', kilograms: 5, dateTime: '2026-10-26T14:30:00Z' });
    pendingCount.set(1);

    const activity = facade.recentActivity();
    expect(activity.map((item) => [item.id, item.pending])).toEqual([
      ['q1', true],
      ['pay1', false],
      ['w1', false],
    ]);
    expect(activity[0]).toMatchObject({ type: 'weighing', displayName: 'Ana', kilograms: 5 });
  });

  it('without signal shows the saved copy of this harvest', async () => {
    store.saveSnapshot('dashboard', { harvestId: 'h1', dashboard });
    service.getDashboard.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    await facade.load();

    expect(facade.dashboard()).toEqual(dashboard);
    expect(facade.error()).toBeNull();
  });

  it('never shows a saved copy of another harvest', async () => {
    store.saveSnapshot('dashboard', { harvestId: 'other', dashboard });
    service.getDashboard.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    await facade.load();

    expect(facade.dashboard()).toBeNull();
    expect(facade.error()).toContain('No hay conexión');
  });

  it('drops the data when the active harvest changes', async () => {
    await facade.load();
    activeHarvest.set({ ...harvest, id: 'h2' });

    expect(facade.dashboard()).toBeNull();
    expect(facade.dailySeries()).toEqual([]);
  });
});
