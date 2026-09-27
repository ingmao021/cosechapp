import { PayNowUseCase } from './pay-now.use-case';
import { PaymentRepository } from '../payment.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { PaymentCalculatorStrategy } from '../payment-calculator';
import { Payment } from '../payment.entity';
import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestWorker } from '@domain/harvest/harvest-worker.entity';
import { HarvestStatus } from '@domain/harvest/harvest-status.enum';
import { HarvestPickerStatus } from '@domain/harvest/harvest-picker-status.enum';
import { InvalidPaymentAmountError } from '@shared/errors/domain-errors';

describe('PayNowUseCase', () => {
  let useCase: PayNowUseCase;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockWeighingRepository: jest.Mocked<WeighingRepository>;
  let mockHarvestWorkerRepository: jest.Mocked<HarvestWorkerRepository>;
  let mockHarvestRepository: jest.Mocked<HarvestRepository>;
  let mockCalculator: jest.Mocked<PaymentCalculatorStrategy>;

  beforeEach(() => {
    mockPaymentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestPickerId: jest.fn(),
      findTotalPaidByHarvestPickerId: jest.fn(),
    };

    mockWeighingRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestPickerId: jest.fn(),
      findByHarvestPickerIdAndDateRange: jest.fn(),
      getTotalKilogramsByHarvestPickerId: jest.fn(),
      getTotalKilogramsByHarvestPickerIdAndDateRange: jest.fn(),
      delete: jest.fn(),
    };

    mockHarvestWorkerRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByHarvestIdAndWorkerId: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findAllByHarvestIdAndStatus: jest.fn(),
      findByIdAndHarvestId: jest.fn(),
    };

    mockHarvestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findActiveByFarmId: jest.fn(),
      findAllByFarmId: jest.fn(),
      findByIdAndFarmId: jest.fn(),
      findAllByFarmIdWithStatus: jest.fn(),
    };

    mockCalculator = {
      calculate: jest.fn(),
    };

    useCase = new PayNowUseCase(
      mockPaymentRepository,
      mockWeighingRepository,
      mockHarvestWorkerRepository,
      mockHarvestRepository,
      mockCalculator,
    );
  });

  it('should create a payment for a picker', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    const harvestWorker = HarvestWorker.create('hw-1', 'harvest-1', 'worker-1');
    const payment = Payment.create('payment-1', 'hw-1', -250000);

    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockHarvestWorkerRepository.findByIdAndHarvestId.mockResolvedValue(harvestWorker);
    mockWeighingRepository.getTotalKilogramsByHarvestPickerId.mockResolvedValue(50);
    mockPaymentRepository.findTotalPaidByHarvestPickerId.mockResolvedValue(0);
    mockCalculator.calculate.mockReturnValue(-250000);
    mockPaymentRepository.save.mockImplementation(async (p) => p);

    const result = await useCase.execute({
      harvestPickerId: 'hw-1',
      harvestId: 'harvest-1',
      includesMeals: false,
      mealDetail: null,
    });

    expect(result.payment).toBeInstanceOf(Payment);
    expect(result.payment.amount).toBe(-250000);
    expect(result.totalKilograms).toBe(50);
    expect(result.amountDue).toBe(250000);
    expect(mockCalculator.calculate).toHaveBeenCalledWith(
      50,
      5000,
      false,
      null,
    );
    expect(mockPaymentRepository.save).toHaveBeenCalled();
  });

  it('should include meal deduction when specified', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    const harvestWorker = HarvestWorker.create('hw-1', 'harvest-1', 'worker-1');
    const payment = Payment.create('payment-1', 'hw-1', -230000);

    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockHarvestWorkerRepository.findByIdAndHarvestId.mockResolvedValue(harvestWorker);
    mockWeighingRepository.getTotalKilogramsByHarvestPickerId.mockResolvedValue(50);
    mockPaymentRepository.findTotalPaidByHarvestPickerId.mockResolvedValue(0);
    mockCalculator.calculate.mockReturnValue(-230000);
    mockPaymentRepository.save.mockImplementation(async (p) => p);

    const result = await useCase.execute({
      harvestPickerId: 'hw-1',
      harvestId: 'harvest-1',
      includesMeals: true,
      mealDetail: '20000',
    });

    expect(result.payment.amount).toBe(-230000);
    expect(mockCalculator.calculate).toHaveBeenCalledWith(
      50,
      5000,
      true,
      '20000',
    );
  });

  it('should throw error when harvest not found', async () => {
    mockHarvestRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        harvestId: 'harvest-1',
        includesMeals: false,
        mealDetail: null,
      }),
    ).rejects.toThrow('Harvest not found');
  });

  it('should throw error when harvest is closed', async () => {
    const harvest = Harvest.reconstitute(
      'harvest-1',
      'farm-1',
      'Closed Harvest',
      5000,
      HarvestStatus.CLOSED,
      new Date('2024-01-01'),
      new Date('2024-06-01'),
      new Date('2024-01-01'),
      new Date('2024-06-01'),
    );
    mockHarvestRepository.findById.mockResolvedValue(harvest);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        harvestId: 'harvest-1',
        includesMeals: false,
        mealDetail: null,
      }),
    ).rejects.toThrow('Cannot pay in a closed harvest');
  });

  it('should throw error when picker not in harvest', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockHarvestWorkerRepository.findByIdAndHarvestId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        harvestId: 'harvest-1',
        includesMeals: false,
        mealDetail: null,
      }),
    ).rejects.toThrow('Harvest picker not found in this harvest');
  });

  it('should throw error when picker is archived', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    const archivedWorker = HarvestWorker.reconstitute(
      'hw-1',
      'harvest-1',
      'worker-1',
      null,
      null,
      HarvestPickerStatus.ARCHIVED,
      new Date('2024-01-01'),
      new Date('2024-01-15'),
    );

    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockHarvestWorkerRepository.findByIdAndHarvestId.mockResolvedValue(archivedWorker);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        harvestId: 'harvest-1',
        includesMeals: false,
        mealDetail: null,
      }),
    ).rejects.toThrow('Cannot pay an archived picker');
  });

  it('should throw error when nothing to pay', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    const harvestWorker = HarvestWorker.create('hw-1', 'harvest-1', 'worker-1');

    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockHarvestWorkerRepository.findByIdAndHarvestId.mockResolvedValue(harvestWorker);
    mockWeighingRepository.getTotalKilogramsByHarvestPickerId.mockResolvedValue(50);
    mockPaymentRepository.findTotalPaidByHarvestPickerId.mockResolvedValue(-250000);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        harvestId: 'harvest-1',
        includesMeals: false,
        mealDetail: null,
      }),
    ).rejects.toThrow('Nothing to pay for this picker');
  });
});