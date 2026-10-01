import { Controller, Post, Body, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { SyncService } from './sync.service';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { SyncWeighingsDto } from './sync.dto';

interface AuthRequest {
  user: AuthUser;
}

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('weighings')
  @ApiOperation({ summary: 'Sync weighings recorded offline (idempotent by id)' })
  @ApiResponse({ status: 200, description: 'All weighings saved (or already saved)' })
  @ApiResponse({ status: 207, description: 'Some weighings failed: see each item status' })
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
