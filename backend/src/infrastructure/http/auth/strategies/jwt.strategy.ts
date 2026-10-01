import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CoffeeGrowerRepository } from '@domain/auth/coffee-grower.repository';
import { Farm } from '@domain/farm/farm.entity';
import { FarmRepository } from '@domain/farm/farm.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject('COFFEE_GROWER_REPOSITORY') private readonly coffeeGrowerRepository: CoffeeGrowerRepository,
    @Inject('FARM_REPOSITORY') private readonly farmRepository: FarmRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret',
    });
  }

  async validate(payload: { sub: string; nationalId: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    // A valid signature is not enough: the account may have been deleted.
    const coffeeGrower = await this.coffeeGrowerRepository.findById(payload.sub);
    if (!coffeeGrower) {
      throw new UnauthorizedException('Invalid token');
    }
    // Each coffee grower has exactly one farm; create it on first use.
    const farm =
      (await this.farmRepository.findByCoffeeGrowerId(coffeeGrower.id)) ??
      (await this.farmRepository.save(Farm.create(crypto.randomUUID(), coffeeGrower.id)));

    return { userId: coffeeGrower.id, nationalId: coffeeGrower.nationalId, farmId: farm.id };
  }
}
