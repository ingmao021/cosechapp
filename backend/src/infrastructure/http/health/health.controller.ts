import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '@infrastructure/persistence/prisma.service';

/** Para el proveedor de despliegue: 200 si el servicio y la base de datos responden. */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + database check' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 503, description: 'Database unreachable' })
  async check() {
    try {
      await this.prisma.getClient().$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return { status: 'ok', database: 'up' };
  }
}
