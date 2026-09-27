import { SaleRepository } from '../sale.repository';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { ProductionCostRepository } from '../production-cost.repository';

export interface GetHarvestProfitUseCaseInput {
  harvestId: string;
}

export interface GetHarvestProfitUseCaseOutput {
  harvestId: string;
  grossRevenue: number;
  totalPickerPayments: number;
  grossProfit: number;
  totalProductionCosts: number;
  actualProfit: number;
  projectedDryKilograms: number;
  actualDryKilograms: number | null;
}

export class GetHarvestProfitUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly weighingRepository: WeighingRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly productionCostRepository: ProductionCostRepository,
  ) {}

  async execute(input: GetHarvestProfitUseCaseInput): Promise<GetHarvestProfitUseCaseOutput> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new Error('Harvest not found');
    }

    const sale = await this.saleRepository.findByHarvestId(input.harvestId);
    
    const harvestWorkers = await this.harvestWorkerRepository.findAllByHarvestId(input.harvestId);
    
    // Calculate total picker payments
    let totalPickerPayments = 0;
    let totalKilograms = 0;
    for (const worker of harvestWorkers) {
      const totalPaid = await this.paymentRepository.findTotalPaidByHarvestPickerId(worker.id);
      const kg = await this.weighingRepository.getTotalKilogramsByHarvestPickerId(worker.id);
      totalPickerPayments += totalPaid;
      totalKilograms += kg;
    }

    // Calculate projected dry kilograms
    const projectedDryKilograms = totalKilograms / 5;

    // Calculate actual profit if sale is recorded
    let grossRevenue = 0;
    let actualDryKilograms: number | null = null;
    
    if (sale) {
      grossRevenue = sale.calculateGrossRevenue();
      actualDryKilograms = sale.actualDryKilograms;
    }

    const grossProfit = grossRevenue + totalPickerPayments; // totalPickerPayments is negative

    // Calculate total production costs
    const totalProductionCosts = await this.productionCostRepository.getTotalByHarvestId(input.harvestId);
    const actualProfit = grossProfit + totalProductionCosts; // totalProductionCosts is negative

    return {
      harvestId: input.harvestId,
      grossRevenue,
      totalPickerPayments,
      grossProfit,
      totalProductionCosts,
      actualProfit,
      projectedDryKilograms,
      actualDryKilograms,
    };
  }
}