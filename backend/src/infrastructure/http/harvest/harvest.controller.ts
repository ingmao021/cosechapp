import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthUser, HarvestService } from './harvest.service';
import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestWorker } from '@domain/harvest/harvest-worker.entity';
import { HarvestStatus } from '@domain/harvest/harvest-status.enum';
import { HarvestPickerStatus } from '@domain/harvest/harvest-picker-status.enum';
import { Crew } from '@domain/harvest/crew.entity';
import { Sale } from '@domain/sale-and-costs/sale.entity';
import { ProductionCost } from '@domain/sale-and-costs/production-cost.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { OpenHarvestDto, AssignWorkerDto, CreateCrewDto, UpdateCrewDto } from './harvest.dto';

interface AuthRequest {
  user: AuthUser;
}

@ApiTags('harvests')
@Controller('harvests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HarvestController {
  constructor(private readonly harvestService: HarvestService) {}

  @Post()
  @ApiOperation({ summary: 'Open a new harvest' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'There is already an active harvest' })
  async openHarvest(@Request() req: AuthRequest, @Body() dto: OpenHarvestDto) {
    const harvest = await this.harvestService.openHarvest(req.user, dto);
    return toHarvestResponse(harvest);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close an active harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async closeHarvest(@Request() req: AuthRequest, @Param('id') id: string) {
    return toHarvestResponse(await this.harvestService.closeHarvest(req.user, id));
  }

  @Post(':id/pickers')
  @ApiOperation({ summary: 'Assign a worker to the harvest (optionally to a crew)' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  @ApiResponse({ status: 201, description: 'Picker created' })
  @ApiResponse({ status: 200, description: 'Worker already in the harvest; moved to the crew' })
  async assignWorker(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: AssignWorkerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { harvestWorker, created } = await this.harvestService.assignWorkerToHarvest(req.user, {
      harvestId: id,
      workerId: dto.workerId,
      harvestAlias: dto.harvestAlias,
      crewId: dto.crewId,
    });
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return toHarvestWorkerResponse(harvestWorker);
  }

  @Patch(':id/pickers/:pickerId/archive')
  @ApiOperation({ summary: 'Archive a picker in the harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  @ApiParam({ name: 'pickerId', description: 'Harvest Picker ID' })
  async archiveWorker(@Request() req: AuthRequest, @Param('id') id: string, @Param('pickerId') pickerId: string) {
    const harvestWorker = await this.harvestService.archiveWorker(req.user, { harvestWorkerId: pickerId, harvestId: id });
    return toHarvestWorkerResponse(harvestWorker);
  }

  @Get(':id/pickers')
  @ApiOperation({ summary: 'Pickers of the harvest with name and totals' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async getPickers(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.harvestService.pickerStats(req.user, id, false);
  }

  @Get(':id/pickers/active')
  @ApiOperation({ summary: 'Active pickers of the harvest with name and totals' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async getActivePickers(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.harvestService.pickerStats(req.user, id, true);
  }

  @Post(':id/crews')
  @ApiOperation({ summary: 'Create a new crew in the harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async createCrew(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: CreateCrewDto) {
    return toCrewResponse(await this.harvestService.createCrew(req.user, { harvestId: id, name: dto.name }));
  }

  @Get(':id/crews')
  @ApiOperation({ summary: 'Get all crews in the harvest' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async getCrews(@Request() req: AuthRequest, @Param('id') id: string) {
    const crews = await this.harvestService.listCrews(req.user, id);
    return crews.map(toCrewResponse);
  }

  @Get(':id/crews/:crewId')
  @ApiOperation({ summary: 'Get a crew by ID' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  @ApiParam({ name: 'crewId', description: 'Crew ID' })
  async getCrew(@Request() req: AuthRequest, @Param('id') id: string, @Param('crewId') crewId: string) {
    return toCrewResponse(await this.harvestService.getCrew(req.user, crewId, id));
  }

  @Patch(':id/crews/:crewId')
  @ApiOperation({ summary: 'Update a crew' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  @ApiParam({ name: 'crewId', description: 'Crew ID' })
  async updateCrew(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Param('crewId') crewId: string,
    @Body() dto: UpdateCrewDto,
  ) {
    return toCrewResponse(await this.harvestService.updateCrew(req.user, { crewId, harvestId: id, name: dto.name }));
  }

  @Delete(':id/crews/:crewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a crew' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  @ApiParam({ name: 'crewId', description: 'Crew ID' })
  async deleteCrew(@Request() req: AuthRequest, @Param('id') id: string, @Param('crewId') crewId: string) {
    await this.harvestService.deleteCrew(req.user, crewId, id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the active harvest for the current farm' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 204, description: 'No active harvest' })
  async getActiveHarvest(@Request() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const harvest = await this.harvestService.findActive(req.user);
    if (!harvest) {
      res.status(HttpStatus.NO_CONTENT);
      return;
    }
    return toHarvestResponse(harvest);
  }

  @Get()
  @ApiOperation({ summary: 'All harvests of the farm; closed ones include their profit' })
  async getAllHarvests(@Request() req: AuthRequest) {
    const harvests = await this.harvestService.findAll(req.user);
    return harvests.map(({ harvest, actualProfit }) => ({ ...toHarvestResponse(harvest), actualProfit }));
  }

  @Get(':id/detail')
  @ApiOperation({ summary: 'Full harvest detail for the history screen' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async getHarvestDetail(@Request() req: AuthRequest, @Param('id') id: string) {
    const detail = await this.harvestService.detail(req.user, id);
    return {
      ...detail,
      harvest: toHarvestResponse(detail.harvest),
      crews: detail.crews.map(toCrewResponse),
      sale: detail.sale ? toSaleSummary(detail.sale) : null,
      costs: detail.costs.map(toCostSummary),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a harvest by ID' })
  @ApiParam({ name: 'id', description: 'Harvest ID' })
  async getHarvest(@Request() req: AuthRequest, @Param('id') id: string) {
    return toHarvestResponse(await this.harvestService.findOne(req.user, id));
  }
}

function toHarvestResponse(harvest: Harvest) {
  return {
    id: harvest.id,
    name: harvest.name,
    pricePerKilogram: harvest.pricePerKilogram,
    status: harvest.status === HarvestStatus.ACTIVE ? 'active' : 'closed',
    openingDate: harvest.openingDate,
    closingDate: harvest.closingDate,
    createdAt: harvest.createdAt,
    updatedAt: harvest.updatedAt,
  };
}

function toHarvestWorkerResponse(harvestWorker: HarvestWorker) {
  return {
    id: harvestWorker.id,
    harvestId: harvestWorker.harvestId,
    workerId: harvestWorker.workerId,
    harvestAlias: harvestWorker.harvestAlias,
    crewId: harvestWorker.crewId,
    status: harvestWorker.status === HarvestPickerStatus.ACTIVE ? 'active' : 'archived',
    createdAt: harvestWorker.createdAt,
    updatedAt: harvestWorker.updatedAt,
  };
}

function toCrewResponse(crew: Crew) {
  return {
    id: crew.id,
    harvestId: crew.harvestId,
    name: crew.name,
    createdAt: crew.createdAt,
    updatedAt: crew.updatedAt,
  };
}

function toSaleSummary(sale: Sale) {
  return {
    actualDryKilograms: sale.actualDryKilograms,
    salePrice: sale.salePrice,
    date: sale.date,
    grossRevenue: sale.calculateGrossRevenue(),
  };
}

function toCostSummary(cost: ProductionCost) {
  return { id: cost.id, description: cost.description, amount: -cost.amount, date: cost.date };
}
