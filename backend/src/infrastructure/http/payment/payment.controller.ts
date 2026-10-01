import { Controller, Post, Get, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';

import { PaymentService } from './payment.service';
import { Payment } from '@domain/payment/payment.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { PayNowDto, PaymentPreviewQueryDto } from './payment.dto';

interface AuthRequest {
  user: AuthUser;
}

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('pay-now')
  @ApiOperation({ summary: 'Pay a picker the pending balance' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  @ApiResponse({ status: 422, description: 'Nothing pending, or meal deduction too high' })
  async payNow(@Request() req: AuthRequest, @Body() dto: PayNowDto) {
    const result = await this.paymentService.payNow(req.user, {
      harvestPickerId: dto.harvestPickerId,
      harvestId: dto.harvestId,
      includesMeals: dto.includesMeals,
      mealDetail: dto.includesMeals && dto.mealDeduction !== undefined ? String(dto.mealDeduction) : null,
    });
    return {
      payment: toPaymentResponse(result.payment),
      totalKilograms: result.totalKilograms,
      amountDue: result.amountDue,
    };
  }

  @Get('picker/:harvestPickerId/preview')
  @ApiOperation({ summary: 'Breakdown of what would be paid now (gross, already paid, meals, net)' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async preview(
    @Request() req: AuthRequest,
    @Param('harvestPickerId') harvestPickerId: string,
    @Query() query: PaymentPreviewQueryDto,
  ) {
    return this.paymentService.preview(req.user, {
      harvestPickerId,
      harvestId: query.harvestId,
      includesMeals: query.includesMeals ?? false,
      mealDetail: query.includesMeals && query.mealDeduction !== undefined ? String(query.mealDeduction) : null,
    });
  }

  @Get('picker/:harvestPickerId')
  @ApiOperation({ summary: 'Get all payments for a picker' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async getPaymentsByPicker(@Request() req: AuthRequest, @Param('harvestPickerId') harvestPickerId: string) {
    const payments = await this.paymentService.getPaymentsByPicker(req.user, harvestPickerId);
    return payments.map(toPaymentResponse);
  }

  @Get('picker/:harvestPickerId/total')
  @ApiOperation({ summary: 'Get total paid to a picker (positive amount)' })
  @ApiParam({ name: 'harvestPickerId', description: 'Harvest Picker ID' })
  async getTotalPaidByPicker(@Request() req: AuthRequest, @Param('harvestPickerId') harvestPickerId: string) {
    const total = await this.paymentService.getTotalPaidByPicker(req.user, harvestPickerId);
    return { harvestPickerId, totalPaid: -total };
  }
}

/** Monto en positivo: lo que recibió el recolector. En la base de datos se guarda en negativo. */
function toPaymentResponse(payment: Payment) {
  return {
    id: payment.id,
    harvestPickerId: payment.harvestPickerId,
    amount: -payment.amount,
    includesMeals: payment.includesMeals,
    mealDeduction: payment.mealDetail ? Number(payment.mealDetail) : 0,
    dateTime: payment.dateTime,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
