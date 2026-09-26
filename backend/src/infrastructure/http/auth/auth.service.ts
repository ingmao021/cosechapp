import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CoffeeGrower } from '@domain/auth/coffee-grower.entity';
import { CoffeeGrowerRepository } from '@domain/auth/coffee-grower.repository';
import { RegisterUseCase } from '@domain/auth/use-cases/register.use-case';
import { LoginUseCase } from '@domain/auth/use-cases/login.use-case';
import { BcryptService } from './bcrypt.service';

@Injectable()
export class AuthService {
  private readonly registerUseCase: RegisterUseCase;
  private readonly loginUseCase: LoginUseCase;

  constructor(
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
    private readonly coffeeGrowerRepository: CoffeeGrowerRepository,
  ) {
    this.registerUseCase = new RegisterUseCase(
      coffeeGrowerRepository,
      (password) => this.bcryptService.hash(password),
      (coffeeGrower) => this.generateToken(coffeeGrower),
    );

    this.loginUseCase = new LoginUseCase(
      coffeeGrowerRepository,
      (password, hash) => this.bcryptService.compare(password, hash),
      (coffeeGrower) => this.generateToken(coffeeGrower),
    );
  }

  async register(input: { nationalId: string; password: string; profilePhoto?: string }) {
    return this.registerUseCase.execute(input);
  }

  async login(input: { nationalId: string; password: string }) {
    return this.loginUseCase.execute(input);
  }

  generateToken(coffeeGrower: CoffeeGrower): string {
    return this.jwtService.sign(
      { sub: coffeeGrower.id, nationalId: coffeeGrower.nationalId },
      { subject: coffeeGrower.id },
    );
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
}