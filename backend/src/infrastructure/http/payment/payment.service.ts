import { Injectable, Inject } from '@nestjs/common';
import { Payment } from '@domain/payment/payment.entity';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { PayNowUseCase } from '@domain/payment/use-cases/pay-now.use-case';
import { PaymentCalculatorStrategy } from '@domain/payment/payment-calculator';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly payNowUseCase: PayNowUseCase,
    @Inject('PAYMENT_CALCULATOR') private readonly paymentCalculator: PaymentCalculatorStrategy,
  ) {}

  async payNow(input: { harvestPickerId: string; harvestId: string; includesMeals: boolean; mealDetail: string | null }) {
    return this.payNowUseCase.execute(input);
  }

  async getPaymentsByPicker(harvestPickerId: string): Promise<Payment[]> {
    return this.paymentRepository.findAllByHarvestPickerId(harvestPickerId);
  }

  async getTotalPaidByPicker(harvestPickerId: string): Promise<number> {
    return this.paymentRepository.findTotalPaidByHarvestPickerId(harvestPickerId);
  }
}