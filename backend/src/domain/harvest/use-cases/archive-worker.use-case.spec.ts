import { ArchiveWorkerUseCase } from './archive-worker.use-case';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { HarvestRepository } from '../harvest.repository';
import { Harvest } from '../harvest.entity';
import { HarvestWorker } from '../harvest-worker.entity';
import { HarvestPickerStatus } from '../harvest-picker-status.enum';
import { HarvestNotActiveError } from '@shared/errors/domain-errors';

describe('ArchiveWorkerUseCase', () => {
  let useCase: ArchiveWorkerUseCase;
  let mockHarvestWorkerRepository: jest.Mocked<HarvestWorkerRepository>;
  let mockHarvestRepository: jest.Mocked<HarvestRepository>;

  beforeEach(() => {
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

    useCase = new ArchiveWorkerUseCase(mockHarvestWorkerRepository, mockHarvestRepository);
  });

  it('should archive an active harvest worker', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    const harvestWorker = HarvestWorker.create('hw-1', 'harvest-1', 'worker-1');

    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockHarvestWorkerRepository.findByIdAndHarvestId.mockResolvedValue(harvestWorker);
    mockHarvestWorkerRepository.save.mockImplementation(async (hw) => hw);

    const result = await useCase.execute({
      harvestWorkerId: 'hw-1',
      harvestId: 'harvest-1',
    });

    expect(result.harvestWorker).toBeInstanceOf(HarvestWorker);
    expect(result.harvestWorker.status).toBe(HarvestPickerStatus.ARCHIVED);
    expect(result.harvestWorker.id).toBe('hw-1');
    expect(mockHarvestWorkerRepository.save).toHaveBeenCalled();
  });

  it('should throw error when harvest not found', async () => {
    mockHarvestRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestWorkerId: 'hw-1',
        harvestId: 'harvest-1',
      }),
    ).rejects.toThrow(HarvestNotActiveError);
  });

  it('should throw error when harvest worker not found', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockHarvestWorkerRepository.findByIdAndHarvestId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestWorkerId: 'hw-1',
        harvestId: 'harvest-1',
      }),
    ).rejects.toThrow('Harvest worker not found');
  });

  it('should throw error when harvest worker already archived', async () => {
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
        harvestWorkerId: 'hw-1',
        harvestId: 'harvest-1',
      }),
    ).rejects.toThrow('Harvest worker is already archived');
  });
});