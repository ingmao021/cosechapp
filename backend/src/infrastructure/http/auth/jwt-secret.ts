import { ConfigService } from '@nestjs/config';

/**
 * Clave con la que se firman los JWT. Sin ella el backend no arranca: una clave por
 * defecto permitiría a cualquiera fabricar sesiones válidas.
 */
export function jwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}
