import { DeleteWorkerUseCase } from './delete-worker.use-case';
import { WorkerRepository } from '../worker.repository';
import { CatalogWorker } from '../worker.entity';
import { WorkerNotFoundError } from '@shared/errors/domain-errors';

describe('DeleteWorkerUseCase', () => {
  let useCase: DeleteWorkerUseCase;
  let mockRepository: jest.Mocked<WorkerRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByCoffeeGrowerId: jest.fn(),
      findByIdAndCoffeeGrowerId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new DeleteWorkerUseCase(mockRepository);
  });

  it('should delete a worker', async () => {
    const worker = CatalogWorker.create('worker-1', 'grower-1', 'Juan', 'Perez', 'Juancho', '3001234567');
    mockRepository.findByIdAndCoffeeGrowerId.mockResolvedValue(worker);
    mockRepository.delete.mockResolvedValue(undefined);

    await useCase.execute({
      workerId: 'worker-1',
      coffeeGrowerId: 'grower-1',
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('worker-1');
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