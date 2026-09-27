import { GetCrewUseCase } from './get-crew.use-case';
import { CrewRepository } from '../crew.repository';
import { Crew } from '../crew.entity';
import { CrewNotFoundError } from '@shared/errors/domain-errors';

describe('GetCrewUseCase', () => {
  let useCase: GetCrewUseCase;
  let mockRepository: jest.Mocked<CrewRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findByIdAndHarvestId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new GetCrewUseCase(mockRepository);
  });

  it('should return a crew when found', async () => {
    const crew = Crew.create('crew-1', 'harvest-1', 'Cuadrilla de Huila');
    mockRepository.findByIdAndHarvestId.mockResolvedValue(crew);

    const result = await useCase.execute({
      crewId: 'crew-1',
      harvestId: 'harvest-1',
    });

    expect(result.crew).toBe(crew);
  });

  it('should throw error when crew not found', async () => {
    mockRepository.findByIdAndHarvestId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        crewId: 'crew-1',
        harvestId: 'harvest-1',
      }),
    ).rejects.toThrow(CrewNotFoundError);
  });
});