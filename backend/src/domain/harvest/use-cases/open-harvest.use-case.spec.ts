import { OpenHarvestUseCase } from './open-harvest.use-case';
import { HarvestRepository } from '../harvest.repository';
import { FarmRepository } from '@domain/farm/farm.repository';
import { Harvest } from '../harvest.entity';
import { HarvestAlreadyActiveError } from '@shared/errors/domain-errors';
import { Farm } from '@domain/farm/farm.entity';
import { HarvestStatus } from '../harvest-status.enum';

describe('OpenHarvestUseCase', () => {
  let useCase: OpenHarvestUseCase;
  let mockHarvestRepository: jest.Mocked<HarvestRepository>;
  let mockFarmRepository: jest.Mocked<FarmRepository>;

  beforeEach(() => {
    mockHarvestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findActiveByFarmId: jest.fn(),
      findAllByFarmId: jest.fn(),
      findByIdAndFarmId: jest.fn(),
      findAllByFarmIdWithStatus: jest.fn(),
    };

    mockFarmRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCoffeeGrowerId: jest.fn(),
    };

    useCase = new OpenHarvestUseCase(mockHarvestRepository, mockFarmRepository);
  });

  it('should open a new harvest when no active harvest exists', async () => {
    const farm = Farm.create('farm-1', 'grower-1');
    mockFarmRepository.findById.mockResolvedValue(farm);
    mockHarvestRepository.findActiveByFarmId.mockResolvedValue(null);
    mockHarvestRepository.save.mockImplementation(async (h: Harvest) => h);

    const result = await useCase.execute({
      farmId: 'farm-1',
      name: 'First Harvest',
      pricePerKilogram: 5000,
    });

    expect(result.harvest).toBeInstanceOf(Harvest);
    expect(result.harvest.name).toBe('First Harvest');
    expect(result.harvest.pricePerKilogram).toBe(5000);
    expect(result.harvest.status).toBe(HarvestStatus.ACTIVE);
    expect(mockHarvestRepository.save).toHaveBeenCalled();
  });

  it('should throw error when there is already an active harvest', async () => {
    const farm = Farm.create('farm-1', 'grower-1');
    const activeHarvest = Harvest.create('harvest-1', 'farm-1', 'Active Harvest', 5000);

    mockFarmRepository.findById.mockResolvedValue(farm);
    mockHarvestRepository.findActiveByFarmId.mockResolvedValue(activeHarvest);

    await expect(
      useCase.execute({
        farmId: 'farm-1',
        name: 'New Harvest',
        pricePerKilogram: 6000,
      }),
    ).rejects.toThrow(HarvestAlreadyActiveError);
  });
});