import { CoffeeGrower } from '../coffee-grower.entity';
import { CoffeeGrowerRepository } from '../coffee-grower.repository';
import { CoffeeGrowerAlreadyExistsError } from '@shared/errors/domain-errors';

export interface RegisterUseCaseInput {
  nationalId: string;
  password: string;
  profilePhoto?: string;
}

export interface RegisterUseCaseOutput {
  coffeeGrower: CoffeeGrower;
  accessToken: string;
}

export class RegisterUseCase {
  constructor(
    private readonly coffeeGrowerRepository: CoffeeGrowerRepository,
    private readonly hashPassword: (password: string) => Promise<string>,
    private readonly generateToken: (coffeeGrower: CoffeeGrower) => string,
  ) {}

  async execute(input: RegisterUseCaseInput): Promise<RegisterUseCaseOutput> {
    const existing = await this.coffeeGrowerRepository.findByNationalId(input.nationalId);
    if (existing) {
      throw new CoffeeGrowerAlreadyExistsError(input.nationalId);
    }

    const passwordHash = await this.hashPassword(input.password);
    const coffeeGrower = CoffeeGrower.create(
      crypto.randomUUID(),
      input.nationalId,
      passwordHash,
      input.profilePhoto ?? null,
    );

    const saved = await this.coffeeGrowerRepository.save(coffeeGrower);
    const accessToken = this.generateToken(saved);

    return { coffeeGrower: saved, accessToken };
  }
}