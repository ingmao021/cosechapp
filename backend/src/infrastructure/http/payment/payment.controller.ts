import { Controller, Post, Get, Param, Body, Query, UseGuards, Request } from '@nestjs/common';

import { PaymentService } from './payment.service';
import { Payment } from '@domain/payment/payment.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { PayNowDto, PaymentPreviewQueryDto } from './payment.dto';

interface AuthRequest {
  user: AuthUser;
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('pay-now')
  async payNow(@Request() req: AuthRequest, @Body() dto: PayNowDto) {
    const result = await this.paymentService.payNow(req.user, {
      harvestPickerId: dto.harvestPickerId,
      harvestId: dto.harvestId,
      includesMeals: dto.includesMeals,
      mealPerDay: dto.includesMeals ? (dto.mealPerDay ?? null) : null,
      mealDetail: dto.includesMeals && dto.mealDeduction !== undefined ? String(dto.mealDeduction) : null,
    });
    return {
      payment: toPaymentResponse(result.payment),
      totalKilograms: result.totalKilograms,
      amountDue: result.amountDue,
    };
  }

  @Get('picker/:harvestPickerId/preview')
  async preview(
    @Request() req: AuthRequest,
    @Param('harvestPickerId') harvestPickerId: string,
    @Query() query: PaymentPreviewQueryDto,
  ) {
    return this.paymentService.preview(req.user, {
      harvestPickerId,
      harvestId: query.harvestId,
      includesMeals: query.includesMeals ?? false,
      mealPerDay: query.includesMeals ? (query.mealPerDay ?? null) : null,
      mealDetail: query.includesMeals && query.mealDeduction !== undefined ? String(query.mealDeduction) : null,
    });
  }

  @Get('picker/:harvestPickerId')
  async getPaymentsByPicker(@Request() req: AuthRequest, @Param('harvestPickerId') harvestPickerId: string) {
    const payments = await this.paymentService.getPaymentsByPicker(req.user, harvestPickerId);
    return payments.map(toPaymentResponse);
  }

  @Get('picker/:harvestPickerId/total')
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
    /** true: liquidación al cerrar la cosecha; false: pago a quien se fue antes. */
    isSettlement: payment.isSettlement,
    dateTime: payment.dateTime,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
