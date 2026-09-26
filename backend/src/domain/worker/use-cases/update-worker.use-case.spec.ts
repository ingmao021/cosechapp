import { UpdateWorkerUseCase } from './update-worker.use-case';
import { WorkerRepository } from '../worker.repository';
import { CatalogWorker } from '../worker.entity';
import { WorkerNotFoundError } from '@shared/errors/domain-errors';

describe('UpdateWorkerUseCase', () => {
  let useCase: UpdateWorkerUseCase;
  let mockRepository: jest.Mocked<WorkerRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByCoffeeGrowerId: jest.fn(),
      findByIdAndCoffeeGrowerId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new UpdateWorkerUseCase(mockRepository);
  });

  it('should update a worker', async () => {
    const existingWorker = CatalogWorker.create('worker-1', 'grower-1', 'Juan', 'Perez', 'Juancho', '3001234567');
    mockRepository.findByIdAndCoffeeGrowerId.mockResolvedValue(existingWorker);
    mockRepository.save.mockImplementation(async (w: CatalogWorker) => w);

    const result = await useCase.execute({
      workerId: 'worker-1',
      coffeeGrowerId: 'grower-1',
      firstName: 'Juan Carlos',
      lastName: 'Perez Lopez',
      alias: 'JC',
      phoneNumber: '3007654321',
    });

    expect(result.worker.firstName).toBe('Juan Carlos');
    expect(result.worker.lastName).toBe('Perez Lopez');
    expect(result.worker.alias).toBe('JC');
    expect(result.worker.phoneNumber).toBe('3007654321');
    expect(result.worker.createdAt).toBe(existingWorker.createdAt);
    expect(result.worker.updatedAt).not.toBe(existingWorker.updatedAt);
  });

  it('should throw error when worker not found', async () => {
    mockRepository.findByIdAndCoffeeGrowerId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        workerId: 'worker-1',
        coffeeGrowerId: 'grower-1',
        firstName: 'Juan',
        lastName: 'Perez',
      }),
    ).rejects.toThrow(WorkerNotFoundError);
  });
});