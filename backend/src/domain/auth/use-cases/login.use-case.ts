import { CoffeeGrower } from '../coffee-grower.entity';
import { CoffeeGrowerRepository } from '../coffee-grower.repository';
import { InvalidCredentialsError } from '@shared/errors/domain-errors';

export interface LoginUseCaseInput {
  nationalId: string;
  password: string;
}

export interface LoginUseCaseOutput {
  coffeeGrower: CoffeeGrower;
  accessToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly coffeeGrowerRepository: CoffeeGrowerRepository,
    private readonly verifyPassword: (password: string, hash: string) => Promise<boolean>,
    private readonly generateToken: (coffeeGrower: CoffeeGrower) => string,
  ) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    const coffeeGrower = await this.coffeeGrowerRepository.findByNationalId(input.nationalId);
    if (!coffeeGrower) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.verifyPassword(input.password, coffeeGrower.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.generateToken(coffeeGrower);

    return { coffeeGrower, accessToken };
  }
}