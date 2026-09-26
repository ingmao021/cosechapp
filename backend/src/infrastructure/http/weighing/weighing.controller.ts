import { Controller, Post, Get, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import { WeighingService } from './weighing.service';
import { Weighing } from '@domain/weighing/weighing.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';

@ApiTags('weighings')
@Controller('weighings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WeighingController {
  constructor(private readonly weighingService: WeighingService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new weighing' })
  async recordWeighing(@Body() dto: RecordWeighingDto) {
    const weighing = await this.weighingService.recordWeighing({
      harvestPickerId: dto.harvestPickerId,
      kilograms: dto.kilograms,
      dateTime: dto.dateTime ? new Date(dto.dateTime) : undefined,
    });
    return this.toResponse(weighing);
  }

  @Get('picker/:harvestPickerId')
  @ApiOperation({ summary: 'Get all weighings for a picker' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async getWeighingsByPicker(@Param('harvestPickerId') harvestPickerId: string) {
    const weighings = await this.weighingService.getWeighingsByPicker(harvestPickerId);
    return weighings.map(this.toResponse);
  }

  @Get('picker/:harvestPickerId/range')
  @ApiOperation({ summary: 'Get weighings for a picker in a date range' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async getWeighingsByPickerAndDateRange(
    @Param('harvestPickerId') harvestPickerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const weighings = await this.weighingService.getWeighingsByPickerAndDateRange(
      harvestPickerId,
      new Date(startDate),
      new Date(endDate),
    );
    return weighings.map(this.toResponse);
  }

  @Get('picker/:harvestPickerId/total')
  @ApiOperation({ summary: 'Get total kilograms for a picker' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async getTotalKilogramsByPicker(@Param('harvestPickerId') harvestPickerId: string) {
    const total = await this.weighingService.getTotalKilogramsByPicker(harvestPickerId);
    return { harvestPickerId, totalKilograms: total };
  }

  @Get('picker/:harvestPickerId/total/range')
  @ApiOperation({ summary: 'Get total kilograms for a picker in a date range' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async getTotalKilogramsByPickerAndDateRange(
    @Param('harvestPickerId') harvestPickerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const total = await this.weighingService.getTotalKilogramsByPickerAndDateRange(
      harvestPickerId,
      new Date(startDate),
      new Date(endDate),
    );
    return { harvestPickerId, totalKilograms: total };
  }

  private toResponse(weighing: Weighing) {
    return {
      id: weighing.id,
      harvestPickerId: weighing.harvestPickerId,
      kilograms: weighing.kilograms,
      dateTime: weighing.dateTime,
      createdAt: weighing.createdAt,
      updatedAt: weighing.updatedAt,
    };
  }
}

export class RecordWeighingDto {
  @IsString()
  harvestPickerId!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  kilograms!: number;

  @IsOptional()
  @IsString()
  dateTime?: string;
}