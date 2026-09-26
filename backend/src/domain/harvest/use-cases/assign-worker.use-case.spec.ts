import { AssignWorkerToHarvestUseCase } from './assign-worker.use-case';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { HarvestRepository } from '../harvest.repository';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { Harvest } from '../harvest.entity';
import { CatalogWorker } from '@domain/worker/worker.entity';
import { HarvestStatus } from '../harvest-status.enum';
import { HarvestPickerStatus } from '../harvest-picker-status.enum';
import { HarvestNotActiveError } from '@shared/errors/domain-errors';

describe('AssignWorkerToHarvestUseCase', () => {
  let useCase: AssignWorkerToHarvestUseCase;
  let mockHarvestWorkerRepository: jest.Mocked<HarvestWorkerRepository>;
  let mockHarvestRepository: jest.Mocked<HarvestRepository>;
  let mockWorkerRepository: jest.Mocked<WorkerRepository>;

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

    mockWorkerRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByCoffeeGrowerId: jest.fn(),
      findByIdAndCoffeeGrowerId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new AssignWorkerToHarvestUseCase(
      mockHarvestWorkerRepository,
      mockHarvestRepository,
      mockWorkerRepository,
    );
  });

  it('should assign a worker to an active harvest', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    const worker = CatalogWorker.create('worker-1', 'grower-1', 'Juan', 'Perez');

    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockWorkerRepository.findById.mockResolvedValue(worker);
    mockHarvestWorkerRepository.findByHarvestIdAndWorkerId.mockResolvedValue(null);
    mockHarvestWorkerRepository.save.mockImplementation(async (hw) => hw);

    const result = await useCase.execute({
      harvestId: 'harvest-1',
      workerId: 'worker-1',
      harvestAlias: 'Juancho',
    });

    expect(result.harvestWorker).toBeInstanceOf(require('../harvest-worker.entity').HarvestWorker);
    expect(result.harvestWorker.harvestId).toBe('harvest-1');
    expect(result.harvestWorker.workerId).toBe('worker-1');
    expect(result.harvestWorker.harvestAlias).toBe('Juancho');
    expect(result.harvestWorker.status).toBe(HarvestPickerStatus.ACTIVE);
    expect(mockHarvestWorkerRepository.save).toHaveBeenCalled();
  });

  it('should throw error when harvest not found', async () => {
    mockHarvestRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestId: 'harvest-1',
        workerId: 'worker-1',
      }),
    ).rejects.toThrow(HarvestNotActiveError);
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
        harvestId: 'harvest-1',
        workerId: 'worker-1',
      }),
    ).rejects.toThrow('Cannot assign workers to a closed harvest');
  });

  it('should throw error when worker not found', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockWorkerRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestId: 'harvest-1',
        workerId: 'worker-1',
      }),
    ).rejects.toThrow('Worker not found');
  });

  it('should throw error when worker already assigned to harvest', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    const worker = CatalogWorker.create('worker-1', 'grower-1', 'Juan', 'Perez');
    const existingHarvestWorker = require('../harvest-worker.entity').HarvestWorker.create(
      'hw-1',
      'harvest-1',
      'worker-1',
    );

    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockWorkerRepository.findById.mockResolvedValue(worker);
    mockHarvestWorkerRepository.findByHarvestIdAndWorkerId.mockResolvedValue(existingHarvestWorker);

    await expect(
      useCase.execute({
        harvestId: 'harvest-1',
        workerId: 'worker-1',
      }),
    ).rejects.toThrow('Worker is already assigned to this harvest');
  });
});