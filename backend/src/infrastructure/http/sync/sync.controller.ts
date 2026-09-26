import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsArray, IsString, IsEnum, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import { SyncService, SyncItem, SyncResult } from './sync.service';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('batch')
  @ApiOperation({ summary: 'Batch sync offline data' })
  async batchSync(@Request() req: any, @Body() dto: BatchSyncDto): Promise<SyncResult> {
    return this.syncService.processBatch(dto.items, req.user.userId);
  }
}

export class BatchSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items!: SyncItemDto[];
}

export class SyncItemDto {
  @IsString()
  entity!: string;

  @IsEnum(['create', 'update', 'delete'])
  operation!: 'create' | 'update' | 'delete';

  @IsOptional()
  data!: any;

  @IsString()
  timestamp!: string;
}