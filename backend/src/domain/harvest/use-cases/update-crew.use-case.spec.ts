import { UpdateCrewUseCase } from './update-crew.use-case';
import { CrewRepository } from '../crew.repository';
import { Crew } from '../crew.entity';
import { CrewNotFoundError } from '@shared/errors/domain-errors';

describe('UpdateCrewUseCase', () => {
  let useCase: UpdateCrewUseCase;
  let mockRepository: jest.Mocked<CrewRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findByIdAndHarvestId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new UpdateCrewUseCase(mockRepository);
  });

  it('should update a crew name', async () => {
    const existingCrew = Crew.create('crew-1', 'harvest-1', 'Cuadrilla de Huila');
    mockRepository.findByIdAndHarvestId.mockResolvedValue(existingCrew);
    mockRepository.save.mockImplementation(async (c) => c);

    const result = await useCase.execute({
      crewId: 'crew-1',
      harvestId: 'harvest-1',
      name: 'Cuadrilla de Nariño',
    });

    expect(result.crew.name).toBe('Cuadrilla de Nariño');
    expect(result.crew.createdAt).toBe(existingCrew.createdAt);
    expect(result.crew.updatedAt).not.toBe(existingCrew.updatedAt);
  });

  it('should throw error when crew not found', async () => {
    mockRepository.findByIdAndHarvestId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        crewId: 'crew-1',
        harvestId: 'harvest-1',
        name: 'Cuadrilla de Nariño',
      }),
    ).rejects.toThrow(CrewNotFoundError);
  });
});