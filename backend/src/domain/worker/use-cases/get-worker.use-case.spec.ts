import { GetWorkerUseCase } from './get-worker.use-case';
import { WorkerRepository } from '../worker.repository';
import { CatalogWorker } from '../worker.entity';
import { WorkerNotFoundError } from '@shared/errors/domain-errors';

describe('GetWorkerUseCase', () => {
  let useCase: GetWorkerUseCase;
  let mockRepository: jest.Mocked<WorkerRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByCoffeeGrowerId: jest.fn(),
      findByIdAndCoffeeGrowerId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new GetWorkerUseCase(mockRepository);
  });

  it('should return a worker when found', async () => {
    const worker = CatalogWorker.create('worker-1', 'grower-1', 'Juan', 'Perez', 'Juancho', '3001234567');
    mockRepository.findByIdAndCoffeeGrowerId.mockResolvedValue(worker);

    const result = await useCase.execute({
      workerId: 'worker-1',
      coffeeGrowerId: 'grower-1',
    });

    expect(result.worker).toBe(worker);
  });

  it('should throw error when worker not found', async () => {
    mockRepository.findByIdAndCoffeeGrowerId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        workerId: 'worker-1',
        coffeeGrowerId: 'grower-1',
      }),
    ).rejects.toThrow(WorkerNotFoundError);
  });
});