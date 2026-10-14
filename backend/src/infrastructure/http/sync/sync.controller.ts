import { Controller, Post, Body, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { SyncService } from './sync.service';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { SyncWeighingsDto } from './sync.dto';

interface AuthRequest {
  user: AuthUser;
}

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('weighings')
  async syncWeighings(
    @Request() req: AuthRequest,
    @Body() dto: SyncWeighingsDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const results = await this.syncService.syncWeighings(req.user, dto.weighings);
    const allSaved = results.every((result) => result.status < 300);
    res.status(allSaved ? HttpStatus.OK : HttpStatus.MULTI_STATUS);
    return { results };
  }
}
