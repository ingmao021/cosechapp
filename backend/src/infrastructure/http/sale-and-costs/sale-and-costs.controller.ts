import { Controller, Post, Get, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Min, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

import { SaleAndCostsService } from './sale-and-costs.service';
import { Sale } from '@domain/sale-and-costs/sale.entity';
import { ProductionCost } from '@domain/sale-and-costs/production-cost.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';

@ApiTags('sale-and-costs')
@Controller('sale-and-costs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SaleAndCostsController {
  constructor(private readonly saleAndCostsService: SaleAndCostsService) {}

  @Post('sale')
  @ApiOperation({ summary: 'Record the sale for a closed harvest' })
  async recordSale(@Body() dto: RecordSaleDto) {
    const result = await this.saleAndCostsService.recordSale({
      harvestId: dto.harvestId,
      actualDryKilograms: dto.actualDryKilograms,
      salePrice: dto.salePrice,
      date: new Date(dto.date),
    });
    return {
      sale: this.toSaleResponse(result.sale),
      grossProfit: result.grossProfit,
    };
  }

  @Post('production-cost')
  @ApiOperation({ summary: 'Add a production cost to a closed harvest' })
  async addProductionCost(@Body() dto: AddProductionCostDto) {
    const result = await this.saleAndCostsService.addProductionCost({
      harvestId: dto.harvestId,
      description: dto.description,
      amount: dto.amount,
      date: new Date(dto.date),
    });
    return {
      cost: this.toCostResponse(result.cost),
      actualProfit: result.actualProfit,
    };
  }

  @Get('profit/:harvestId')
  @ApiOperation({ summary: 'Get profit calculation for a harvest' })
  @ApiParam({ name: 'harvestId', description: 'Harvest ID' })
  async getHarvestProfit(@Param('harvestId') harvestId: string) {
    return this.saleAndCostsService.getHarvestProfit(harvestId);
  }

  @Get('project-dry-kg')
  @ApiOperation({ summary: 'Project dry kilograms from cherry kilograms' })
  async projectDryKilograms(@Query('cherryKilograms') cherryKilograms: string) {
    const projected = await this.saleAndCostsService.projectDryKilograms(parseFloat(cherryKilograms));
    return { cherryKilograms: parseFloat(cherryKilograms), projectedDryKilograms: projected };
  }

  @Get('sale/:harvestId')
  @ApiOperation({ summary: 'Get sale for a harvest' })
  @ApiParam({ name: 'harvestId', description: 'Harvest ID' })
  async getSale(@Param('harvestId') harvestId: string) {
    const sale = await this.saleAndCostsService.getSaleByHarvestId(harvestId);
    return sale ? this.toSaleResponse(sale) : null;
  }

  @Get('production-costs/:harvestId')
  @ApiOperation({ summary: 'Get production costs for a harvest' })
  @ApiParam({ name: 'harvestId', description: 'Harvest ID' })
  async getProductionCosts(@Param('harvestId') harvestId: string) {
    const costs = await this.saleAndCostsService.getProductionCostsByHarvestId(harvestId);
    return costs.map(this.toCostResponse);
  }

  private toSaleResponse(sale: Sale) {
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

  private toCostResponse(cost: ProductionCost) {
    return {
      id: cost.id,
      harvestId: cost.harvestId,
      description: cost.description,
      amount: cost.amount,
      date: cost.date,
      createdAt: cost.createdAt,
      updatedAt: cost.updatedAt,
    };
  }
}

export class RecordSaleDto {
  @IsString()
  harvestId!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  actualDryKilograms!: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  salePrice!: number;

  @IsString()
  date!: string;
}

export class AddProductionCostDto {
  @IsString()
  harvestId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description!: string;

  @IsNumber()
  @Type(() => Number)
  amount!: number; // Negative value

  @IsString()
  date!: string;
}