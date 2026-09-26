import { LoginUseCase } from './login.use-case';
import { CoffeeGrowerRepository } from '../coffee-grower.repository';
import { CoffeeGrower } from '../coffee-grower.entity';
import { InvalidCredentialsError } from '@shared/errors/domain-errors';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockRepository: jest.Mocked<CoffeeGrowerRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByNationalId: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new LoginUseCase(
      mockRepository,
      async (password: string, hash: string) => hash === `hashed-${password}`,
      (coffeeGrower: CoffeeGrower) => `token-${coffeeGrower.id}`,
    );
  });

  it('should login with valid credentials', async () => {
    const coffeeGrower = CoffeeGrower.create('1', '1234567890', 'hashed-password123', null);
    mockRepository.findByNationalId.mockResolvedValue(coffeeGrower);

    const result = await useCase.execute({
      nationalId: '1234567890',
      password: 'password123',
    });

    expect(result.coffeeGrower).toBeInstanceOf(CoffeeGrower);
    expect(result.coffeeGrower.nationalId).toBe('1234567890');
    expect(result.accessToken).toBeDefined();
  });

  it('should throw error for non-existent national ID', async () => {
    mockRepository.findByNationalId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        nationalId: '1234567890',
        password: 'password123',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw error for invalid password', async () => {
    const coffeeGrower = CoffeeGrower.create('1', '1234567890', 'hashed-password123', null);
    mockRepository.findByNationalId.mockResolvedValue(coffeeGrower);

    await expect(
      useCase.execute({
        nationalId: '1234567890',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});