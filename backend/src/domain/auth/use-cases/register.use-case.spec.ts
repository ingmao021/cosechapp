import { RegisterUseCase } from './register.use-case';
import { CoffeeGrowerRepository } from '../coffee-grower.repository';
import { CoffeeGrower } from '../coffee-grower.entity';
import { CoffeeGrowerAlreadyExistsError } from '@shared/errors/domain-errors';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockRepository: jest.Mocked<CoffeeGrowerRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByNationalId: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new RegisterUseCase(
      mockRepository,
      async (password: string) => `hashed-${password}`,
      (coffeeGrower: CoffeeGrower) => `token-${coffeeGrower.id}`,
    );
  });

  it('should register a new coffee grower', async () => {
    mockRepository.findByNationalId.mockResolvedValue(null);
    mockRepository.save.mockImplementation(async (cg: CoffeeGrower) => cg);

    const result = await useCase.execute({
      nationalId: '1234567890',
      password: 'password123',
    });

    expect(result.coffeeGrower).toBeInstanceOf(CoffeeGrower);
    expect(result.coffeeGrower.nationalId).toBe('1234567890');
    expect(result.accessToken).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should throw error if coffee grower already exists', async () => {
    mockRepository.findByNationalId.mockResolvedValue(
      CoffeeGrower.create('1', '1234567890', 'hash', null),
    );

    await expect(
      useCase.execute({
        nationalId: '1234567890',
        password: 'password123',
      }),
    ).rejects.toThrow(CoffeeGrowerAlreadyExistsError);
  });
});