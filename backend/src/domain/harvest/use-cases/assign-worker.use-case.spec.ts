import { AssignWorkerToHarvestUseCase } from './assign-worker.use-case';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { HarvestRepository } from '../harvest.repository';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { Harvest } from '../harvest.entity';
import { CatalogWorker } from '@domain/worker/worker.entity';
import { HarvestStatus } from '../harvest-status.enum';
import { HarvestPickerStatus } from '../harvest-picker-status.enum';
import { HarvestNotActiveError, CrewNotFoundError } from '@shared/errors/domain-errors';
import { CrewRepository } from '../crew.repository';
import { Crew } from '../crew.entity';
import { HarvestWorker } from '../harvest-worker.entity';

describe('AssignWorkerToHarvestUseCase', () => {
  let useCase: AssignWorkerToHarvestUseCase;
  let mockHarvestWorkerRepository: jest.Mocked<HarvestWorkerRepository>;
  let mockHarvestRepository: jest.Mocked<HarvestRepository>;
  let mockWorkerRepository: jest.Mocked<WorkerRepository>;
  let mockCrewRepository: jest.Mocked<CrewRepository>;

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

    mockCrewRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findByIdAndHarvestId: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CrewRepository>;

    useCase = new AssignWorkerToHarvestUseCase(
      mockHarvestWorkerRepository,
      mockHarvestRepository,
      mockWorkerRepository,
      mockCrewRepository,
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

    expect(result.harvestWorker).toBeInstanceOf(HarvestWorker);
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
    const existingHarvestWorker = HarvestWorker.create(
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

  describe('with crewId', () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    const worker = CatalogWorker.create('worker-1', 'grower-1', 'Juan', 'Perez');

    beforeEach(() => {
      mockHarvestRepository.findById.mockResolvedValue(harvest);
      mockWorkerRepository.findById.mockResolvedValue(worker);
      mockHarvestWorkerRepository.save.mockImplementation(async (hw: HarvestWorker) => hw);
    });

    it('should assign a new picker directly to the crew', async () => {
      mockCrewRepository.findByIdAndHarvestId.mockResolvedValue(Crew.create('crew-1', 'harvest-1', 'Cuadrilla 1'));
      mockHarvestWorkerRepository.findByHarvestIdAndWorkerId.mockResolvedValue(null);

      const result = await useCase.execute({ harvestId: 'harvest-1', workerId: 'worker-1', crewId: 'crew-1' });

      expect(result.harvestWorker.crewId).toBe('crew-1');
    });

    it('should move a picker already in the harvest to the crew', async () => {
      mockCrewRepository.findByIdAndHarvestId.mockResolvedValue(Crew.create('crew-2', 'harvest-1', 'Cuadrilla 2'));
      mockHarvestWorkerRepository.findByHarvestIdAndWorkerId.mockResolvedValue(
        HarvestWorker.create('hw-1', 'harvest-1', 'worker-1', null, 'crew-1'),
      );

      const result = await useCase.execute({ harvestId: 'harvest-1', workerId: 'worker-1', crewId: 'crew-2' });

      expect(result.harvestWorker.id).toBe('hw-1');
      expect(result.harvestWorker.crewId).toBe('crew-2');
    });

    it('should reject a crew from another harvest', async () => {
      mockCrewRepository.findByIdAndHarvestId.mockResolvedValue(null);

      await expect(
        useCase.execute({ harvestId: 'harvest-1', workerId: 'worker-1', crewId: 'foreign-crew' }),
      ).rejects.toThrow(CrewNotFoundError);
      expect(mockHarvestWorkerRepository.save).not.toHaveBeenCalled();
    });
  });
});