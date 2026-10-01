import { ChangePasswordUseCase } from './change-password.use-case';
import { CoffeeGrowerRepository } from '../coffee-grower.repository';
import { CoffeeGrower } from '../coffee-grower.entity';
import { IncorrectCurrentPasswordError, ResourceNotFoundError } from '@shared/errors/domain-errors';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let mockRepository: jest.Mocked<CoffeeGrowerRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(async (coffeeGrower: CoffeeGrower) => coffeeGrower),
      findById: jest.fn(),
      findByNationalId: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new ChangePasswordUseCase(
      mockRepository,
      async (password: string, hash: string) => hash === `hashed-${password}`,
      async (password: string) => `hashed-${password}`,
    );
  });

  it('should save the new password hash when the current password is correct', async () => {
    mockRepository.findById.mockResolvedValue(CoffeeGrower.create('1', '1234567890', 'hashed-old-pass'));

    await useCase.execute({ coffeeGrowerId: '1', currentPassword: 'old-pass', newPassword: 'new-pass' });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', passwordHash: 'hashed-new-pass' }),
    );
  });

  it('should reject an incorrect current password without saving', async () => {
    mockRepository.findById.mockResolvedValue(CoffeeGrower.create('1', '1234567890', 'hashed-old-pass'));

    await expect(
      useCase.execute({ coffeeGrowerId: '1', currentPassword: 'wrong', newPassword: 'new-pass' }),
    ).rejects.toThrow(IncorrectCurrentPasswordError);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when the coffee grower does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ coffeeGrowerId: 'missing', currentPassword: 'old-pass', newPassword: 'new-pass' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
