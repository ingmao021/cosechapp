import { CoffeeGrower } from '../coffee-grower.entity';
import { CoffeeGrowerRepository } from '../coffee-grower.repository';
import { InvalidCredentialsError } from '@shared/errors/domain-errors';
import { LoginAttemptLimiter } from '../login-attempt-limiter';

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
    private readonly attemptLimiter: LoginAttemptLimiter,
  ) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    this.attemptLimiter.assertAllowed(input.nationalId);

    const coffeeGrower = await this.coffeeGrowerRepository.findByNationalId(input.nationalId);
    // Una cédula inexistente cuenta igual que una contraseña errada: no revela qué cuentas existen.
    if (!coffeeGrower || !(await this.verifyPassword(input.password, coffeeGrower.passwordHash))) {
      this.attemptLimiter.recordFailure(input.nationalId);
      throw new InvalidCredentialsError();
    }
    this.attemptLimiter.recordSuccess(input.nationalId);

    const accessToken = this.generateToken(coffeeGrower);

    return { coffeeGrower, accessToken };
  }
}