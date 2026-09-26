import { CloseHarvestUseCase } from './close-harvest.use-case';
import { HarvestRepository } from '../harvest.repository';
import { Harvest } from '../harvest.entity';
import { HarvestNotActiveError, HarvestAlreadyClosedError } from '@shared/errors/domain-errors';
import { HarvestStatus } from '../harvest-status.enum';

describe('CloseHarvestUseCase', () => {
  let useCase: CloseHarvestUseCase;
  let mockHarvestRepository: jest.Mocked<HarvestRepository>;

  beforeEach(() => {
    mockHarvestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findActiveByFarmId: jest.fn(),
      findAllByFarmId: jest.fn(),
      findByIdAndFarmId: jest.fn(),
      findAllByFarmIdWithStatus: jest.fn(),
    };

    useCase = new CloseHarvestUseCase(mockHarvestRepository);
  });

  it('should close an active harvest', async () => {
    const activeHarvest = Harvest.create('harvest-1', 'farm-1', 'Active Harvest', 5000);
    mockHarvestRepository.findByIdAndFarmId.mockResolvedValue(activeHarvest);
    mockHarvestRepository.save.mockImplementation(async (h: Harvest) => h);

    const result = await useCase.execute({
      harvestId: 'harvest-1',
      farmId: 'farm-1',
    });

    expect(result.harvest).toBeInstanceOf(Harvest);
    expect(result.harvest.status).toBe(HarvestStatus.CLOSED);
    expect(result.harvest.closingDate).toBeDefined();
    expect(mockHarvestRepository.save).toHaveBeenCalled();
  });

  it('should throw error when harvest is not found', async () => {
    mockHarvestRepository.findByIdAndFarmId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        harvestId: 'harvest-1',
        farmId: 'farm-1',
      }),
    ).rejects.toThrow(HarvestNotActiveError);
  });

  it('should throw error when harvest is already closed', async () => {
    const closedHarvest = Harvest.reconstitute(
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

    mockHarvestRepository.findByIdAndFarmId.mockResolvedValue(closedHarvest);

    await expect(
      useCase.execute({
        harvestId: 'harvest-1',
        farmId: 'farm-1',
      }),
    ).rejects.toThrow(HarvestAlreadyClosedError);
  });
});