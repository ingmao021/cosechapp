import { Payment } from '../payment.entity';
import { PaymentRepository } from '../payment.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { PaymentCalculatorStrategy } from '../payment-calculator';
import { InvalidPaymentAmountError } from '@shared/errors/domain-errors';
import { HarvestPickerStatus } from '@domain/harvest/harvest-picker-status.enum';
import { HarvestStatus } from '@domain/harvest/harvest-status.enum';

export interface PayNowUseCaseInput {
  harvestPickerId: string;
  harvestId: string;
  includesMeals: boolean;
  mealDetail: string | null;
}

export interface PayNowUseCaseOutput {
  payment: Payment;
  totalKilograms: number;
  amountDue: number;
}

export class PayNowUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly weighingRepository: WeighingRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly paymentCalculator: PaymentCalculatorStrategy,
  ) {}

  async execute(input: PayNowUseCaseInput): Promise<PayNowUseCaseOutput> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new Error('Harvest not found');
    }
    if (!harvest.isActive()) {
      throw new Error('Cannot pay in a closed harvest');
    }

    const harvestWorker = await this.harvestWorkerRepository.findByIdAndHarvestId(
      input.harvestPickerId,
      input.harvestId,
    );
    if (!harvestWorker) {
      throw new Error('Harvest picker not found in this harvest');
    }
    if (!harvestWorker.isActive()) {
      throw new Error('Cannot pay an archived picker');
    }

    const totalKilograms = await this.weighingRepository.getTotalKilogramsByHarvestPickerId(
      input.harvestPickerId,
    );

    const totalPaid = await this.paymentRepository.findTotalPaidByHarvestPickerId(
      input.harvestPickerId,
    );

    const grossDue = totalKilograms * harvest.pricePerKilogram;
    const mealDeduction = input.includesMeals && input.mealDetail
      ? parseFloat(input.mealDetail) || 0
      : 0;
    const netDue = grossDue - mealDeduction;
    const remainingDue = netDue + totalPaid; // totalPaid is negative

    if (remainingDue <= 0) {
      throw new Error('Nothing to pay for this picker');
    }

    const amount = this.paymentCalculator.calculate(
      totalKilograms,
      harvest.pricePerKilogram,
      input.includesMeals,
      input.mealDetail,
    );

    const payment = Payment.create(
      crypto.randomUUID(),
      input.harvestPickerId,
      amount,
      input.includesMeals,
      input.mealDetail,
    );

    const saved = await this.paymentRepository.save(payment);

    return {
      payment: saved,
      totalKilograms,
      amountDue: remainingDue,
    };
  }
}