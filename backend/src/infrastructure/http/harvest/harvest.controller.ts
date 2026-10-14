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
  Query,
} from '@nestjs/common';
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
import {
  OpenHarvestDto,
  AssignWorkerDto,
  CreateCrewDto,
  UpdateCrewDto,
  UpdateHarvestDto,
  UpdatePickerDto,
  CloseHarvestDto,
  ClosePreviewQueryDto,
} from './harvest.dto';

interface AuthRequest {
  user: AuthUser;
}

@Controller('harvests')
@UseGuards(JwtAuthGuard)
export class HarvestController {
  constructor(private readonly harvestService: HarvestService) {}

  @Post()
  async openHarvest(@Request() req: AuthRequest, @Body() dto: OpenHarvestDto) {
    const harvest = await this.harvestService.openHarvest(req.user, dto);
    return toHarvestResponse(harvest);
  }

  @Patch(':id/close')
  async closeHarvest(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: CloseHarvestDto) {
    const result = await this.harvestService.closeHarvest(req.user, id, dto.includesMeals ? (dto.mealPerDay ?? null) : null);
    return {
      ...toHarvestResponse(result.harvest),
      settlement: { settledPickers: result.settledPickers, totalNet: result.totalNet, totalMeals: result.totalMeals },
    };
  }

  @Get(':id/close-preview')
  async closePreview(@Request() req: AuthRequest, @Param('id') id: string, @Query() query: ClosePreviewQueryDto) {
    return this.harvestService.closePreview(req.user, id, query.includesMeals ? (query.mealPerDay ?? null) : null);
  }

  @Get(':id/pickers/:pickerId/statement')
  async pickerStatement(@Request() req: AuthRequest, @Param('id') id: string, @Param('pickerId') pickerId: string) {
    return this.harvestService.pickerStatement(req.user, id, pickerId);
  }

  @Post(':id/pickers')
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

  @Patch(':id/pickers/:pickerId')
  async updatePicker(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Param('pickerId') pickerId: string,
    @Body() dto: UpdatePickerDto,
  ) {
    const harvestWorker = await this.harvestService.updatePicker(req.user, {
      harvestId: id,
      pickerId,
      crewId: dto.crewId,
      harvestAlias: dto.harvestAlias,
    });
    return toHarvestWorkerResponse(harvestWorker);
  }

  @Delete(':id/pickers/:pickerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePicker(@Request() req: AuthRequest, @Param('id') id: string, @Param('pickerId') pickerId: string) {
    await this.harvestService.deletePicker(req.user, id, pickerId);
  }

  @Patch(':id/pickers/:pickerId/archive')
  async archiveWorker(@Request() req: AuthRequest, @Param('id') id: string, @Param('pickerId') pickerId: string) {
    const harvestWorker = await this.harvestService.archiveWorker(req.user, { harvestWorkerId: pickerId, harvestId: id });
    return toHarvestWorkerResponse(harvestWorker);
  }

  @Get(':id/pickers')
  async getPickers(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.harvestService.pickerStats(req.user, id, false);
  }

  @Get(':id/pickers/active')
  async getActivePickers(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.harvestService.pickerStats(req.user, id, true);
  }

  @Post(':id/crews')
  async createCrew(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: CreateCrewDto) {
    return toCrewResponse(await this.harvestService.createCrew(req.user, { harvestId: id, name: dto.name }));
  }

  @Get(':id/crews')
  async getCrews(@Request() req: AuthRequest, @Param('id') id: string) {
    const crews = await this.harvestService.listCrews(req.user, id);
    return crews.map(toCrewResponse);
  }

  @Get(':id/crews/:crewId')
  async getCrew(@Request() req: AuthRequest, @Param('id') id: string, @Param('crewId') crewId: string) {
    return toCrewResponse(await this.harvestService.getCrew(req.user, crewId, id));
  }

  @Patch(':id/crews/:crewId')
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
  async deleteCrew(@Request() req: AuthRequest, @Param('id') id: string, @Param('crewId') crewId: string) {
    await this.harvestService.deleteCrew(req.user, crewId, id);
  }

  @Get('active')
  async getActiveHarvest(@Request() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const harvest = await this.harvestService.findActive(req.user);
    if (!harvest) {
      res.status(HttpStatus.NO_CONTENT);
      return;
    }
    return toHarvestResponse(harvest);
  }

  @Get()
  async getAllHarvests(@Request() req: AuthRequest) {
    const harvests = await this.harvestService.findAll(req.user);
    return harvests.map(({ harvest, actualProfit }) => ({ ...toHarvestResponse(harvest), actualProfit }));
  }

  @Get(':id/detail')
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

  @Patch(':id')
  async updateHarvest(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateHarvestDto) {
    return toHarvestResponse(
      await this.harvestService.updateHarvest(req.user, id, { name: dto.name, pricePerKilogram: dto.pricePerKilogram }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHarvest(@Request() req: AuthRequest, @Param('id') id: string) {
    await this.harvestService.deleteHarvest(req.user, id);
  }

  @Get(':id')
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
