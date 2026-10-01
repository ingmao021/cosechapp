import { RecordWeighingUseCase } from './record-weighing.use-case';
import { WeighingRepository } from '../weighing.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { Weighing } from '../weighing.entity';
import { HarvestWorker } from '@domain/harvest/harvest-worker.entity';
import { HarvestPickerStatus } from '@domain/harvest/harvest-picker-status.enum';
import { InvalidKilogramsError, IdempotencyKeyConflictError } from '@shared/errors/domain-errors';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { Harvest } from '@domain/harvest/harvest.entity';

describe('RecordWeighingUseCase', () => {
  let useCase: RecordWeighingUseCase;
  let mockWeighingRepository: jest.Mocked<WeighingRepository>;
  let mockHarvestWorkerRepository: jest.Mocked<HarvestWorkerRepository>;
  let mockHarvestRepository: jest.Mocked<HarvestRepository>;

  beforeEach(() => {
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
      findById: jest.fn().mockResolvedValue(Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000)),
      findActiveByFarmId: jest.fn(),
      findAllByFarmId: jest.fn(),
      findByIdAndFarmId: jest.fn(),
      findAllByFarmIdWithStatus: jest.fn(),
    };

    useCase = new RecordWeighingUseCase(mockWeighingRepository, mockHarvestWorkerRepository, mockHarvestRepository);
  });

  describe('idempotency and harvest state', () => {
    it('should use the client id and report it as created', async () => {
      mockHarvestWorkerRepository.findById.mockResolvedValue(HarvestWorker.create('hw-1', 'harvest-1', 'worker-1'));
      mockWeighingRepository.findById.mockResolvedValue(null);
      mockWeighingRepository.save.mockImplementation(async (w) => w);

      const result = await useCase.execute({ id: 'client-uuid', harvestPickerId: 'hw-1', kilograms: 12 });

      expect(result.created).toBe(true);
      expect(result.weighing.id).toBe('client-uuid');
    });

    it('should return the existing weighing when the same id is sent again', async () => {
      const existing = Weighing.create('client-uuid', 'hw-1', 12);
      mockWeighingRepository.findById.mockResolvedValue(existing);

      const result = await useCase.execute({ id: 'client-uuid', harvestPickerId: 'hw-1', kilograms: 12 });

      expect(result.created).toBe(false);
      expect(result.weighing).toBe(existing);
      expect(mockWeighingRepository.save).not.toHaveBeenCalled();
    });

    it('should reject a reused id with different data', async () => {
      mockWeighingRepository.findById.mockResolvedValue(Weighing.create('client-uuid', 'hw-1', 12));

      await expect(
        useCase.execute({ id: 'client-uuid', harvestPickerId: 'hw-2', kilograms: 12 }),
      ).rejects.toThrow(IdempotencyKeyConflictError);
    });

    it('should reject weighings in a closed harvest', async () => {
      mockHarvestWorkerRepository.findById.mockResolvedValue(HarvestWorker.create('hw-1', 'harvest-1', 'worker-1'));
      mockHarvestRepository.findById.mockResolvedValue(Harvest.create('harvest-1', 'farm-1', 'Test', 5000).close());

      await expect(useCase.execute({ harvestPickerId: 'hw-1', kilograms: 5 })).rejects.toThrow(
        'Cannot record weighing in a closed harvest',
      );
    });
  });

  it('should record a weighing for an active picker', async () => {
    const harvestWorker = HarvestWorker.create('hw-1', 'harvest-1', 'worker-1');
    mockHarvestWorkerRepository.findById.mockResolvedValue(harvestWorker);
    mockWeighingRepository.save.mockImplementation(async (w) => w);

    const result = await useCase.execute({
      harvestPickerId: 'hw-1',
      kilograms: 50,
    });

    expect(result.weighing).toBeInstanceOf(Weighing);
    expect(result.weighing.kilograms).toBe(50);
    expect(result.weighing.harvestPickerId).toBe('hw-1');
    expect(mockWeighingRepository.save).toHaveBeenCalled();
  });

  it('should throw error for negative kilograms', async () => {
    const harvestWorker = HarvestWorker.create('hw-1', 'harvest-1', 'worker-1');
    mockHarvestWorkerRepository.findById.mockResolvedValue(harvestWorker);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        kilograms: -5,
      }),
    ).rejects.toThrow(InvalidKilogramsError);
  });

  it('should throw error for zero kilograms', async () => {
    const harvestWorker = HarvestWorker.create('hw-1', 'harvest-1', 'worker-1');
    mockHarvestWorkerRepository.findById.mockResolvedValue(harvestWorker);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        kilograms: 0,
      }),
    ).rejects.toThrow(InvalidKilogramsError);
  });

  it('should throw error when harvest picker not found', async () => {
    mockHarvestWorkerRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        kilograms: 50,
      }),
    ).rejects.toThrow('Harvest picker not found');
  });

  it('should throw error when harvest picker is archived', async () => {
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
    mockHarvestWorkerRepository.findById.mockResolvedValue(archivedWorker);

    await expect(
      useCase.execute({
        harvestPickerId: 'hw-1',
        kilograms: 50,
      }),
    ).rejects.toThrow('Cannot record weighing for archived picker');
  });

  it('should use provided dateTime', async () => {
    const harvestWorker = HarvestWorker.create('hw-1', 'harvest-1', 'worker-1');
    const customDate = new Date('2024-06-15T10:30:00');
    mockHarvestWorkerRepository.findById.mockResolvedValue(harvestWorker);
    mockWeighingRepository.save.mockImplementation(async (w) => w);

    const result = await useCase.execute({
      harvestPickerId: 'hw-1',
      kilograms: 50,
      dateTime: customDate,
    });

    expect(result.weighing.dateTime).toBe(customDate);
  });
});