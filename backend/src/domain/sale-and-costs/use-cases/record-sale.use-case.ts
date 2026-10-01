import { Sale } from '../sale.entity';
import { SaleRepository } from '../sale.repository';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { SaleAlreadyRecordedError, BusinessRuleViolationError, ResourceNotFoundError } from '@shared/errors/domain-errors';

export interface RecordSaleUseCaseInput {
  harvestId: string;
  actualDryKilograms: number;
  salePrice: number;
  date: Date;
}

export interface RecordSaleUseCaseOutput {
  sale: Sale;
  grossProfit: number;
}

export class RecordSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly weighingRepository: WeighingRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
  ) {}

  async execute(input: RecordSaleUseCaseInput): Promise<RecordSaleUseCaseOutput> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new ResourceNotFoundError('Harvest not found');
    }
    if (!harvest.isClosed()) {
      throw new BusinessRuleViolationError('Harvest must be closed before recording sale');
    }

    const existingSale = await this.saleRepository.findByHarvestId(input.harvestId);
    if (existingSale) {
      throw new SaleAlreadyRecordedError();
    }

    const sale = Sale.create(
      crypto.randomUUID(),
      input.harvestId,
      input.actualDryKilograms,
      input.salePrice,
      input.date,
    );

    const saved = await this.saleRepository.save(sale);

    // Calculate gross profit: sale - picker payments
    const harvestWorkers = await this.harvestWorkerRepository.findAllByHarvestId(input.harvestId);
    let totalPickerPayments = 0;
    for (const worker of harvestWorkers) {
      const totalPaid = await this.paymentRepository.findTotalPaidByHarvestPickerId(worker.id);
      totalPickerPayments += totalPaid;
    }

    const grossRevenue = saved.calculateGrossRevenue();
    const grossProfit = grossRevenue + totalPickerPayments; // totalPickerPayments is negative

    return { sale: saved, grossProfit };
  }
}