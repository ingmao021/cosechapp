import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

import { PaymentService } from './payment.service';
import { Payment } from '@domain/payment/payment.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('pay-now')
  @ApiOperation({ summary: 'Pay a picker now (Pay Now button)' })
  async payNow(@Body() dto: PayNowDto) {
    const result = await this.paymentService.payNow({
      harvestPickerId: dto.harvestPickerId,
      harvestId: dto.harvestId,
      includesMeals: dto.includesMeals,
      mealDetail: dto.mealDetail ?? null,
    });
    return {
      payment: this.toResponse(result.payment),
      totalKilograms: result.totalKilograms,
      amountDue: result.amountDue,
    };
  }

  @Get('picker/:harvestPickerId')
  @ApiOperation({ summary: 'Get all payments for a picker' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async getPaymentsByPicker(@Param('harvestPickerId') harvestPickerId: string) {
    const payments = await this.paymentService.getPaymentsByPicker(harvestPickerId);
    return payments.map(this.toResponse);
  }

  @Get('picker/:harvestPickerId/total')
  @ApiOperation({ summary: 'Get total paid to a picker' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async getTotalPaidByPicker(@Param('harvestPickerId') harvestPickerId: string) {
    const total = await this.paymentService.getTotalPaidByPicker(harvestPickerId);
    return { harvestPickerId, totalPaid: total };
  }

  private toResponse(payment: Payment) {
    return {
      id: payment.id,
      harvestPickerId: payment.harvestPickerId,
      amount: payment.amount,
      includesMeals: payment.includesMeals,
      mealDetail: payment.mealDetail,
      dateTime: payment.dateTime,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}

export class PayNowDto {
  @IsString()
  harvestPickerId!: string;

  @IsString()
  harvestId!: string;

  @IsBoolean()
  includesMeals!: boolean;

  @IsOptional()
  @IsString()
  mealDetail?: string;
}