import { CloseHarvestUseCase } from './close-harvest.use-case';
import { HarvestRepository } from '../harvest.repository';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { Harvest } from '../harvest.entity';
import { HarvestWorker } from '../harvest-worker.entity';
import { Payment } from '@domain/payment/payment.entity';
import { Weighing } from '@domain/weighing/weighing.entity';
import { HarvestNotActiveError, HarvestAlreadyClosedError } from '@shared/errors/domain-errors';
import { HarvestStatus } from '../harvest-status.enum';
import { settlementFor } from '@domain/payment/settlement';

const weighing = (pickerId: string, kg: number, iso: string) => Weighing.create(crypto.randomUUID(), pickerId, kg, new Date(iso));

describe('CloseHarvestUseCase (closing pays everyone)', () => {
  let harvests: jest.Mocked<HarvestRepository>;
  let pickers: jest.Mocked<HarvestWorkerRepository>;
  let paymentRepo: jest.Mocked<PaymentRepository>;
  let weighingRepo: jest.Mocked<WeighingRepository>;
  let weighings: Record<string, Weighing[]>;
  let payments: Record<string, Payment[]>;
  let useCase: CloseHarvestUseCase;

  beforeEach(() => {
    // Ana: 2 días (30 kg). Beto: 1 día (10 kg), ya le pagaron 6.000 al irse. Ceci: archivada, 1 día (5 kg).
    weighings = {
      ana: [weighing('ana', 20, '2026-10-06T14:00:00Z'), weighing('ana', 10, '2026-10-07T14:00:00Z')],
      beto: [weighing('beto', 10, '2026-10-06T14:00:00Z')],
      ceci: [weighing('ceci', 5, '2026-10-06T15:00:00Z')],
    };
    payments = { ana: [], beto: [Payment.create('p-beto', 'beto', -6000, false, null, new Date('2026-10-06T22:00:00Z'))], ceci: [] };

    harvests = {
      save: jest.fn(),
      findById: jest.fn(),
      findActiveByFarmId: jest.fn(),
      findAllByFarmId: jest.fn(),
      findByIdAndFarmId: jest.fn().mockResolvedValue(Harvest.create('h1', 'farm-1', 'Traviesa', 1000)),
      findAllByFarmIdWithStatus: jest.fn(),
      countRecords: jest.fn(),
      delete: jest.fn(),
      closeWithSettlements: jest.fn(async (h: Harvest, _payments: Payment[]) => h),
    };
    pickers = {
      save: jest.fn(),
      findById: jest.fn(),
      findByHarvestIdAndWorkerId: jest.fn(),
      findAllByHarvestId: jest.fn().mockResolvedValue([
        HarvestWorker.create('ana', 'h1', 'w-ana'),
        HarvestWorker.create('beto', 'h1', 'w-beto'),
        HarvestWorker.create('ceci', 'h1', 'w-ceci').archive(),
      ]),
      findAllByHarvestIdAndStatus: jest.fn(),
      findByIdAndHarvestId: jest.fn(),
      countRecords: jest.fn(),
      delete: jest.fn(),
    };
    paymentRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestPickerId: jest.fn(async (id: string) => payments[id] ?? []),
      findTotalPaidByHarvestPickerId: jest.fn(),
    };
    weighingRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestPickerId: jest.fn(async (id: string) => weighings[id] ?? []),
      findByHarvestPickerIdAndDateRange: jest.fn(),
      getTotalKilogramsByHarvestPickerId: jest.fn(async (id: string) => (weighings[id] ?? []).reduce((s, w) => s + w.kilograms, 0)),
      getTotalKilogramsByHarvestPickerIdAndDateRange: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CloseHarvestUseCase(harvests, pickers, paymentRepo, weighingRepo);
  });

  it('pays everyone their pending balance without meals and closes in one go', async () => {
    const result = await useCase.execute({ harvestId: 'h1', farmId: 'farm-1' });

    expect(result.harvest.status).toBe(HarvestStatus.CLOSED);
    const [, saved] = harvests.closeWithSettlements.mock.calls[0];
    // Ana 30.000, Beto 10.000 − 6.000 ya pagados, Ceci (archivada) 5.000
    expect(saved.map((p) => [p.harvestPickerId, -p.amount, p.isSettlement])).toEqual([
      ['ana', 30000, true],
      ['beto', 4000, true],
      ['ceci', 5000, true],
    ]);
    expect(result).toMatchObject({ settledPickers: 3, totalNet: 39000, totalMeals: 0 });
  });

  it('charges the meal per day to everyone for the days they weighed since their last payment', async () => {
    const result = await useCase.execute({ harvestId: 'h1', farmId: 'farm-1', mealPerDay: 3000 });

    const ana = result.pickers.find((p) => p.harvestPickerId === 'ana')!;
    expect(ana).toMatchObject({ mealDays: 2, mealDeduction: 6000, net: 24000 });
    // Beto pesó solo el día en que se le pagó (antes del pago): esa comida no se repite.
    expect(result.pickers.find((p) => p.harvestPickerId === 'beto')).toMatchObject({ mealDays: 0, net: 4000 });
    const [, saved] = harvests.closeWithSettlements.mock.calls[0];
    expect(saved.find((p) => p.harvestPickerId === 'ana')).toMatchObject({ includesMeals: true, mealDetail: '6000' });
  });

  it('caps the meal at what is pending: the cash can be 0, never negative', async () => {
    const result = await useCase.execute({ harvestId: 'h1', farmId: 'farm-1', mealPerDay: 8000 });

    const ceci = result.pickers.find((p) => p.harvestPickerId === 'ceci')!;
    expect(ceci).toMatchObject({ pending: 5000, mealDeduction: 5000, net: 0 });
    const [, saved] = harvests.closeWithSettlements.mock.calls[0];
    expect(saved.find((p) => p.harvestPickerId === 'ceci')).toMatchObject({ amount: -0, mealDetail: '5000' });
  });

  it('skips pickers already fully paid and saves nothing on preview', async () => {
    payments.ana = [Payment.create('p-ana', 'ana', -30000, false, null, new Date('2026-10-07T22:00:00Z'))];

    const preview = await useCase.preview({ harvestId: 'h1', farmId: 'farm-1' });

    expect(preview.settledPickers).toBe(2);
    expect(harvests.closeWithSettlements).not.toHaveBeenCalled();
  });

  it('rejects a missing or already closed harvest', async () => {
    harvests.findByIdAndFarmId.mockResolvedValueOnce(null);
    await expect(useCase.execute({ harvestId: 'h1', farmId: 'farm-1' })).rejects.toThrow(HarvestNotActiveError);

    harvests.findByIdAndFarmId.mockResolvedValueOnce(Harvest.create('h1', 'farm-1', 'X', 1000).close());
    await expect(useCase.execute({ harvestId: 'h1', farmId: 'farm-1' })).rejects.toThrow(HarvestAlreadyClosedError);
  });
});

describe('settlementFor', () => {
  it('is pending minus meals, and pending already counts previous meals', () => {
    const previous = Payment.create('p1', 'x', -5000, true, '2000', new Date('2026-10-06T22:00:00Z'));
    const result = settlementFor({
      totalKilograms: 10,
      pricePerKilogram: 1000,
      payments: [previous],
      weighings: [weighing('x', 10, '2026-10-07T14:00:00Z')],
      mealPerDay: 1000,
    });

    expect(result).toMatchObject({ gross: 10000, alreadyPaid: 5000, previousMealDeductions: 2000, pending: 3000, mealDays: 1, mealDeduction: 1000, net: 2000 });
  });
});
