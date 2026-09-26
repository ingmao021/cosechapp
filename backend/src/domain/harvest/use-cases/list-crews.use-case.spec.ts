import { ListCrewsUseCase } from './list-crews.use-case';
import { CrewRepository } from '../crew.repository';
import { Crew } from '../crew.entity';

describe('ListCrewsUseCase', () => {
  let useCase: ListCrewsUseCase;
  let mockRepository: jest.Mocked<CrewRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findByIdAndHarvestId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new ListCrewsUseCase(mockRepository);
  });

  it('should return all crews for a harvest', async () => {
    const crews = [
      Crew.create('crew-1', 'harvest-1', 'Cuadrilla de Huila'),
      Crew.create('crew-2', 'harvest-1', 'Cuadrilla Local'),
    ];
    mockRepository.findAllByHarvestId.mockResolvedValue(crews);

    const result = await useCase.execute({
      harvestId: 'harvest-1',
    });

    expect(result.crews).toHaveLength(2);
    expect(result.crews[0].name).toBe('Cuadrilla de Huila');
    expect(result.crews[1].name).toBe('Cuadrilla Local');
  });

  it('should return empty array when no crews', async () => {
    mockRepository.findAllByHarvestId.mockResolvedValue([]);

    const result = await useCase.execute({
      harvestId: 'harvest-1',
    });

    expect(result.crews).toHaveLength(0);
  });
});