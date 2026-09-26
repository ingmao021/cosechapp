import { Controller, Post, Patch, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Min, MaxLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import { HarvestService } from './harvest.service';
import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestWorker } from '@domain/harvest/harvest-worker.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';

@ApiTags('harvests')
@Controller('harvests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HarvestController {
  constructor(private readonly harvestService: HarvestService) {}

  @Post()
  @ApiOperation({ summary: 'Open a new harvest' })
  async openHarvest(@Request() req: any, @Body() dto: OpenHarvestDto) {
    const farmId = req.user.farmId || '';
    const harvest = await this.harvestService.openHarvest({
      farmId,
      name: dto.name,
      pricePerKilogram: dto.pricePerKilogram,
    });
    return this.toResponse(harvest);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close an active harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async closeHarvest(@Request() req: any, @Param('id') id: string) {
    const farmId = req.user.farmId || '';
    const harvest = await this.harvestService.closeHarvest({
      harvestId: id,
      farmId,
    });
    return this.toResponse(harvest);
  }

  @Post(':id/pickers')
  @ApiOperation({ summary: 'Assign a worker to the harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async assignWorker(@Request() req: any, @Param('id') id: string, @Body() dto: AssignWorkerDto) {
    const harvestWorker = await this.harvestService.assignWorkerToHarvest({
      harvestId: id,
      workerId: dto.workerId,
      harvestAlias: dto.harvestAlias,
    });
    return this.toHarvestWorkerResponse(harvestWorker);
  }

  @Patch(':id/pickers/:pickerId/archive')
  @ApiOperation({ summary: 'Archive a picker in the harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  @ApiParam({ name: 'pickerId', description: 'Harvest Picker ID' })
  async archiveWorker(@Request() req: any, @Param('id') id: string, @Param('pickerId') pickerId: string) {
    const harvestWorker = await this.harvestService.archiveWorker({
      harvestWorkerId: pickerId,
      harvestId: id,
    });
    return this.toHarvestWorkerResponse(harvestWorker);
  }

  @Get(':id/pickers')
  @ApiOperation({ summary: 'Get all pickers assigned to the harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async getPickers(@Request() req: any, @Param('id') id: string) {
    const pickers = await this.harvestService.getHarvestWorkers(id);
    return pickers.map(this.toHarvestWorkerResponse);
  }

  @Get(':id/pickers/active')
  @ApiOperation({ summary: 'Get active pickers in the harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async getActivePickers(@Request() req: any, @Param('id') id: string) {
    const pickers = await this.harvestService.getActiveHarvestWorkers(id);
    return pickers.map(this.toHarvestWorkerResponse);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the active harvest for the current farm' })
  async getActiveHarvest(@Request() req: any) {
    const farmId = req.user.farmId || '';
    const harvest = await this.harvestService.findActiveByFarmId(farmId);
    return harvest ? this.toResponse(harvest) : null;
  }

  @Get()
  @ApiOperation({ summary: 'Get all harvests for the current farm' })
  async getAllHarvests(@Request() req: any) {
    const farmId = req.user.farmId || '';
    const harvests = await this.harvestService.findAllByFarmId(farmId);
    return harvests.map(this.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a harvest by ID' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async getHarvest(@Request() req: any, @Param('id') id: string) {
    const farmId = req.user.farmId || '';
    const harvest = await this.harvestService.findByIdAndFarmId(id, farmId);
    return harvest ? this.toResponse(harvest) : null;
  }

  private toResponse(harvest: Harvest) {
    return {
      id: harvest.id,
      name: harvest.name,
      pricePerKilogram: harvest.pricePerKilogram,
      status: harvest.status,
      openingDate: harvest.openingDate,
      closingDate: harvest.closingDate,
      createdAt: harvest.createdAt,
      updatedAt: harvest.updatedAt,
    };
  }

  private toHarvestWorkerResponse(harvestWorker: HarvestWorker) {
    return {
      id: harvestWorker.id,
      harvestId: harvestWorker.harvestId,
      workerId: harvestWorker.workerId,
      harvestAlias: harvestWorker.harvestAlias,
      crewId: harvestWorker.crewId,
      status: harvestWorker.status,
      createdAt: harvestWorker.createdAt,
      updatedAt: harvestWorker.updatedAt,
    };
  }
}

export class OpenHarvestDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  pricePerKilogram!: number;
}

export class AssignWorkerDto {
  @IsString()
  workerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  harvestAlias?: string;
}