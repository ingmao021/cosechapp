import { ListWorkersUseCase } from './list-workers.use-case';
import { WorkerRepository } from '../worker.repository';
import { CatalogWorker } from '../worker.entity';

describe('ListWorkersUseCase', () => {
  let useCase: ListWorkersUseCase;
  let mockRepository: jest.Mocked<WorkerRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByCoffeeGrowerId: jest.fn(),
      findByIdAndCoffeeGrowerId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new ListWorkersUseCase(mockRepository);
  });

  it('should return all workers for a coffee grower', async () => {
    const workers = [
      CatalogWorker.create('worker-1', 'grower-1', 'Juan', 'Perez', 'Juancho', '3001234567'),
      CatalogWorker.create('worker-2', 'grower-1', 'Maria', 'Garcia', null, null),
    ];
    mockRepository.findAllByCoffeeGrowerId.mockResolvedValue(workers);

    const result = await useCase.execute({
      coffeeGrowerId: 'grower-1',
    });

    expect(result.workers).toHaveLength(2);
    expect(result.workers[0].firstName).toBe('Juan');
    expect(result.workers[1].firstName).toBe('Maria');
  });

  it('should return empty array when no workers', async () => {
    mockRepository.findAllByCoffeeGrowerId.mockResolvedValue([]);

    const result = await useCase.execute({
      coffeeGrowerId: 'grower-1',
    });

    expect(result.workers).toHaveLength(0);
  });
});