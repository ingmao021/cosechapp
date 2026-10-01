import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * Protege endpoints de sistema (ej. publicar el precio FNC desde un proceso programado).
 * Exige el header `x-admin-key` igual a ADMIN_API_KEY. Sin la variable configurada,
 * el endpoint queda cerrado para todos.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('ADMIN_API_KEY');
    const provided = context.switchToHttp().getRequest().headers['x-admin-key'];

    if (!expected || typeof provided !== 'string' || !safeEqual(provided, expected)) {
      throw new ForbiddenException('Admin key required');
    }
    return true;
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
