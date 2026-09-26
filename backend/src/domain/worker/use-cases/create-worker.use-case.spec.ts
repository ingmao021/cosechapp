import { CreateWorkerUseCase } from './create-worker.use-case';
import { WorkerRepository } from '../worker.repository';
import { CatalogWorker } from '../worker.entity';

describe('CreateWorkerUseCase', () => {
  let useCase: CreateWorkerUseCase;
  let mockRepository: jest.Mocked<WorkerRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByCoffeeGrowerId: jest.fn(),
      findByIdAndCoffeeGrowerId: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new CreateWorkerUseCase(mockRepository);
  });

  it('should create a new worker', async () => {
    mockRepository.save.mockImplementation(async (w: CatalogWorker) => w);

    const result = await useCase.execute({
      coffeeGrowerId: 'grower-1',
      firstName: 'Juan',
      lastName: 'Perez',
      alias: 'Juancho',
      phoneNumber: '3001234567',
    });

    expect(result.worker).toBeInstanceOf(CatalogWorker);
    expect(result.worker.firstName).toBe('Juan');
    expect(result.worker.lastName).toBe('Perez');
    expect(result.worker.alias).toBe('Juancho');
    expect(result.worker.phoneNumber).toBe('3001234567');
    expect(result.worker.coffeeGrowerId).toBe('grower-1');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should create a worker without optional fields', async () => {
    mockRepository.save.mockImplementation(async (w: CatalogWorker) => w);

    const result = await useCase.execute({
      coffeeGrowerId: 'grower-1',
      firstName: 'Maria',
      lastName: 'Garcia',
    });

    expect(result.worker.alias).toBeNull();
    expect(result.worker.phoneNumber).toBeNull();
  });
});