import { DeleteCrewUseCase } from './delete-crew.use-case';
import { CrewRepository } from '../crew.repository';
import { Crew } from '../crew.entity';
import { CrewNotFoundError } from '@shared/errors/domain-errors';

describe('DeleteCrewUseCase', () => {
  let useCase: DeleteCrewUseCase;
  let mockRepository: jest.Mocked<CrewRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findByIdAndHarvestId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new DeleteCrewUseCase(mockRepository);
  });

  it('should delete a crew', async () => {
    const crew = Crew.create('crew-1', 'harvest-1', 'Cuadrilla de Huila');
    mockRepository.findByIdAndHarvestId.mockResolvedValue(crew);
    mockRepository.delete.mockResolvedValue(undefined);

    await useCase.execute({
      crewId: 'crew-1',
      harvestId: 'harvest-1',
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('crew-1');
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