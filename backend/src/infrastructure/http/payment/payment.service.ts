import { Injectable, Inject } from '@nestjs/common';
import { Payment } from '@domain/payment/payment.entity';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { PayNowUseCase, PayNowUseCaseInput, PaymentPreview } from '@domain/payment/use-cases/pay-now.use-case';
import { OwnershipService } from '@infrastructure/http/ownership.service';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENT_REPOSITORY') private readonly paymentRepository: PaymentRepository,
    private readonly payNowUseCase: PayNowUseCase,
    private readonly ownership: OwnershipService,
  ) {}

  async preview(user: AuthUser, input: PayNowUseCaseInput): Promise<PaymentPreview> {
    await this.ownership.harvestFor(input.harvestId, user.farmId);
    return this.payNowUseCase.preview(input);
  }

  async payNow(user: AuthUser, input: PayNowUseCaseInput) {
    await this.ownership.harvestFor(input.harvestId, user.farmId);
    return this.payNowUseCase.execute(input);
  }

  async getPaymentsByPicker(user: AuthUser, harvestPickerId: string): Promise<Payment[]> {
    await this.ownership.pickerFor(harvestPickerId, user.farmId);
    return this.paymentRepository.findAllByHarvestPickerId(harvestPickerId);
  }

  async getTotalPaidByPicker(user: AuthUser, harvestPickerId: string): Promise<number> {
    await this.ownership.pickerFor(harvestPickerId, user.farmId);
    return this.paymentRepository.findTotalPaidByHarvestPickerId(harvestPickerId);
  }
}
