import { CoffeeGrowerRepository } from '../coffee-grower.repository';
import { IncorrectCurrentPasswordError, ResourceNotFoundError } from '@shared/errors/domain-errors';

export interface ChangePasswordUseCaseInput {
  coffeeGrowerId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly coffeeGrowerRepository: CoffeeGrowerRepository,
    private readonly verifyPassword: (password: string, hash: string) => Promise<boolean>,
    private readonly hashPassword: (password: string) => Promise<string>,
  ) {}

  async execute(input: ChangePasswordUseCaseInput): Promise<void> {
    const coffeeGrower = await this.coffeeGrowerRepository.findById(input.coffeeGrowerId);
    if (!coffeeGrower) {
      throw new ResourceNotFoundError('Coffee grower not found');
    }

    const isValid = await this.verifyPassword(input.currentPassword, coffeeGrower.passwordHash);
    if (!isValid) {
      throw new IncorrectCurrentPasswordError();
    }

    const newPasswordHash = await this.hashPassword(input.newPassword);
    await this.coffeeGrowerRepository.save(coffeeGrower.updatePassword(newPasswordHash));
  }
}
