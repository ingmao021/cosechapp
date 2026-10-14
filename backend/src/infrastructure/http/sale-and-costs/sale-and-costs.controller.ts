import { Controller, Post, Get, Param, Body, Query, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { SaleAndCostsService } from './sale-and-costs.service';
import { Sale } from '@domain/sale-and-costs/sale.entity';
import { ProductionCost } from '@domain/sale-and-costs/production-cost.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { RecordSaleDto, AddProductionCostDto, ProjectDryKilogramsQueryDto } from './sale-and-costs.dto';

interface AuthRequest {
  user: AuthUser;
}

/**
 * Montos en positivo en la API (lo que el caficultor recibió o gastó). El dominio
 * guarda pagos y costos en negativo; la conversión se hace aquí.
 */
@Controller('sale-and-costs')
@UseGuards(JwtAuthGuard)
export class SaleAndCostsController {
  constructor(private readonly saleAndCostsService: SaleAndCostsService) {}

  @Post('sale')
  async recordSale(@Request() req: AuthRequest, @Body() dto: RecordSaleDto) {
    const result = await this.saleAndCostsService.recordSale(req.user, {
      harvestId: dto.harvestId,
      actualDryKilograms: dto.actualDryKilograms,
      salePrice: dto.salePrice,
      date: new Date(dto.date),
    });
    return { sale: toSaleResponse(result.sale), grossProfit: result.grossProfit };
  }

  @Post('production-cost')
  async addProductionCost(@Request() req: AuthRequest, @Body() dto: AddProductionCostDto) {
    const result = await this.saleAndCostsService.addProductionCost(req.user, {
      harvestId: dto.harvestId,
      description: dto.description,
      amount: dto.amount,
      date: new Date(dto.date),
    });
    return { cost: toCostResponse(result.cost), actualProfit: result.actualProfit };
  }

  @Get('profit/:harvestId')
  async getHarvestProfit(@Request() req: AuthRequest, @Param('harvestId') harvestId: string) {
    const profit = await this.saleAndCostsService.getHarvestProfit(req.user, harvestId);
    return {
      ...profit,
      totalPickerPayments: -profit.totalPickerPayments,
      totalProductionCosts: -profit.totalProductionCosts,
    };
  }

  @Get('project-dry-kg')
  projectDryKilograms(@Query() query: ProjectDryKilogramsQueryDto) {
    return {
      cherryKilograms: query.cherryKilograms,
      projectedDryKilograms: this.saleAndCostsService.projectDryKilograms(query.cherryKilograms),
    };
  }

  @Get('sale/:harvestId')
  async getSale(
    @Request() req: AuthRequest,
    @Param('harvestId') harvestId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sale = await this.saleAndCostsService.getSaleByHarvestId(req.user, harvestId);
    if (!sale) {
      res.status(HttpStatus.NO_CONTENT);
      return;
    }
    return toSaleResponse(sale);
  }

  @Get('production-costs/:harvestId')
  async getProductionCosts(@Request() req: AuthRequest, @Param('harvestId') harvestId: string) {
    const costs = await this.saleAndCostsService.getProductionCostsByHarvestId(req.user, harvestId);
    return costs.map(toCostResponse);
  }
}

function toSaleResponse(sale: Sale) {
  return {
    id: sale.id,
    harvestId: sale.harvestId,
    actualDryKilograms: sale.actualDryKilograms,
    salePrice: sale.salePrice,
    date: sale.date,
    grossRevenue: sale.calculateGrossRevenue(),
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
}

function toCostResponse(cost: ProductionCost) {
  return {
    id: cost.id,
    harvestId: cost.harvestId,
    description: cost.description,
    amount: -cost.amount,
    date: cost.date,
    createdAt: cost.createdAt,
    updatedAt: cost.updatedAt,
  };
}
