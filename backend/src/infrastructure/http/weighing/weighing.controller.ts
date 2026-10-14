import { Controller, Post, Get, Param, Body, Query, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { WeighingService } from './weighing.service';
import { Weighing } from '@domain/weighing/weighing.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { RecordWeighingDto, DateRangeQueryDto } from './weighing.dto';

interface AuthRequest {
  user: AuthUser;
}

@Controller('weighings')
@UseGuards(JwtAuthGuard)
export class WeighingController {
  constructor(private readonly weighingService: WeighingService) {}

  @Post()
  async recordWeighing(
    @Request() req: AuthRequest,
    @Body() dto: RecordWeighingDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { weighing, created } = await this.weighingService.recordWeighing(req.user, {
      id: dto.id,
      harvestPickerId: dto.harvestPickerId,
      kilograms: dto.kilograms,
      dateTime: dto.dateTime ? new Date(dto.dateTime) : undefined,
    });
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return toWeighingResponse(weighing);
  }

  @Get('picker/:harvestPickerId')
  async getWeighingsByPicker(@Request() req: AuthRequest, @Param('harvestPickerId') harvestPickerId: string) {
    const weighings = await this.weighingService.getWeighingsByPicker(req.user, harvestPickerId);
    return weighings.map(toWeighingResponse);
  }

  @Get('picker/:harvestPickerId/range')
  async getWeighingsByPickerAndDateRange(
    @Request() req: AuthRequest,
    @Param('harvestPickerId') harvestPickerId: string,
    @Query() range: DateRangeQueryDto,
  ) {
    const weighings = await this.weighingService.getWeighingsByPickerAndDateRange(
      req.user,
      harvestPickerId,
      new Date(range.startDate),
      new Date(range.endDate),
    );
    return weighings.map(toWeighingResponse);
  }

  @Get('picker/:harvestPickerId/total')
  async getTotalKilogramsByPicker(@Request() req: AuthRequest, @Param('harvestPickerId') harvestPickerId: string) {
    const total = await this.weighingService.getTotalKilogramsByPicker(req.user, harvestPickerId);
    return { harvestPickerId, totalKilograms: total };
  }

  @Get('picker/:harvestPickerId/total/range')
  async getTotalKilogramsByPickerAndDateRange(
    @Request() req: AuthRequest,
    @Param('harvestPickerId') harvestPickerId: string,
    @Query() range: DateRangeQueryDto,
  ) {
    const total = await this.weighingService.getTotalKilogramsByPickerAndDateRange(
      req.user,
      harvestPickerId,
      new Date(range.startDate),
      new Date(range.endDate),
    );
    return { harvestPickerId, totalKilograms: total };
  }
}

export function toWeighingResponse(weighing: Weighing) {
  return {
    id: weighing.id,
    harvestPickerId: weighing.harvestPickerId,
    kilograms: weighing.kilograms,
    dateTime: weighing.dateTime,
    createdAt: weighing.createdAt,
    updatedAt: weighing.updatedAt,
  };
}
