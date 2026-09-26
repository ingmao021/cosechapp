import { CreateCrewUseCase } from './create-crew.use-case';
import { CrewRepository } from '../crew.repository';
import { HarvestRepository } from '../harvest.repository';
import { Crew } from '../crew.entity';
import { Harvest } from '../harvest.entity';
import { HarvestStatus } from '../harvest-status.enum';
import { HarvestNotActiveError } from '@shared/errors/domain-errors';

describe('CreateCrewUseCase', () => {
  let useCase: CreateCrewUseCase;
  let mockCrewRepository: jest.Mocked<CrewRepository>;
  let mockHarvestRepository: jest.Mocked<HarvestRepository>;

  beforeEach(() => {
    mockCrewRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findByIdAndHarvestId: jest.fn(),
      delete: jest.fn(),
    };

    mockHarvestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findActiveByFarmId: jest.fn(),
      findAllByFarmId: jest.fn(),
      findByIdAndFarmId: jest.fn(),
      findAllByFarmIdWithStatus: jest.fn(),
    };

    useCase = new CreateCrewUseCase(mockCrewRepository, mockHarvestRepository);
  });

  it('should create a new crew in an active harvest', async () => {
    const harvest = Harvest.create('harvest-1', 'farm-1', 'Test Harvest', 5000);
    mockHarvestRepository.findById.mockResolvedValue(harvest);
    mockCrewRepository.save.mockImplementation(async (c) => c);

    const result = await useCase.execute({
      harvestId: 'harvest-1',
      name: 'Cuadrilla de Huila',
    });

    expect(result.crew).toBeInstanceOf(Crew);
    expect(result.crew.name).toBe('Cuadrilla de Huila');
    expect(result.crew.harvestId).toBe('harvest-1');
    expect(mockCrewRepository.save).toHaveBeenCalled();
  });

  it('should throw error when harvest not found', async () => {
    mockHarvestRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestId: 'harvest-1',
        name: 'Cuadrilla de Huila',
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
        name: 'Cuadrilla de Huila',
      }),
    ).rejects.toThrow('Cannot create crews in a closed harvest');
  });
});