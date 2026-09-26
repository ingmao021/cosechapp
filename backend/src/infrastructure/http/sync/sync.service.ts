import { Injectable } from '@nestjs/common';
import { CoffeeGrowerRepository } from '@domain/auth/coffee-grower.repository';
import { FarmRepository } from '@domain/farm/farm.repository';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { CrewRepository } from '@domain/harvest/crew.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { SaleRepository } from '@domain/sale-and-costs/sale.repository';
import { ProductionCostRepository } from '@domain/sale-and-costs/production-cost.repository';
import { HarvestStatus } from '@domain/harvest/harvest-status.enum';
import { HarvestPickerStatus } from '@domain/harvest/harvest-picker-status.enum';

export interface SyncItem {
  entity: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  processed: number;
  errors: string[];
}

@Injectable()
export class SyncService {
  constructor(
    private readonly coffeeGrowerRepository: CoffeeGrowerRepository,
    private readonly farmRepository: FarmRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly workerRepository: WorkerRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly crewRepository: CrewRepository,
    private readonly weighingRepository: WeighingRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly saleRepository: SaleRepository,
    private readonly productionCostRepository: ProductionCostRepository,
  ) {}

  async processBatch(items: SyncItem[], coffeeGrowerId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let processed = 0;

    // Sort by timestamp (oldest first) for last-write-wins
    const sortedItems = [...items].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const item of sortedItems) {
      try {
        await this.processItem(item, coffeeGrowerId);
        processed++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to process ${item.entity} ${item.operation}: ${errorMessage}`);
      }
    }

    return { success: errors.length === 0, processed, errors };
  }

  private async processItem(item: SyncItem, coffeeGrowerId: string): Promise<void> {
    switch (item.entity) {
      case 'coffeeGrower':
        if (item.operation === 'create' || item.operation === 'update') {
          const { CoffeeGrower } = await import('@domain/auth/coffee-grower.entity');
          const grower = CoffeeGrower.reconstitute(
            item.data.id,
            item.data.nationalId,
            item.data.passwordHash,
            item.data.profilePhoto,
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.coffeeGrowerRepository.save(grower);
        }
        break;

      case 'farm':
        if (item.operation === 'create' || item.operation === 'update') {
          const { Farm } = await import('@domain/farm/farm.entity');
          const farm = Farm.reconstitute(
            item.data.id,
            item.data.coffeeGrowerId,
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.farmRepository.save(farm);
        }
        break;

      case 'harvest':
        if (item.operation === 'create' || item.operation === 'update') {
          const { Harvest } = await import('@domain/harvest/harvest.entity');
          const harvest = Harvest.reconstitute(
            item.data.id,
            item.data.farmId,
            item.data.name,
            item.data.pricePerKilogram,
            item.data.status as HarvestStatus,
            new Date(item.data.openingDate),
            item.data.closingDate ? new Date(item.data.closingDate) : null,
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.harvestRepository.save(harvest);
        }
        break;

      case 'worker':
        if (item.operation === 'create' || item.operation === 'update') {
          const { CatalogWorker } = await import('@domain/worker/worker.entity');
          const worker = CatalogWorker.reconstitute(
            item.data.id,
            item.data.coffeeGrowerId,
            item.data.firstName,
            item.data.lastName,
            item.data.alias,
            item.data.phoneNumber,
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.workerRepository.save(worker);
        } else if (item.operation === 'delete') {
          await this.workerRepository.delete(item.data.id);
        }
        break;

      case 'harvestWorker':
        if (item.operation === 'create' || item.operation === 'update') {
          const { HarvestWorker } = await import('@domain/harvest/harvest-worker.entity');
          const hw = HarvestWorker.reconstitute(
            item.data.id,
            item.data.harvestId,
            item.data.workerId,
            item.data.harvestAlias,
            item.data.crewId,
            item.data.status as HarvestPickerStatus,
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.harvestWorkerRepository.save(hw);
        }
        break;

      case 'crew':
        if (item.operation === 'create' || item.operation === 'update') {
          const { Crew } = await import('@domain/harvest/crew.entity');
          const crew = Crew.reconstitute(
            item.data.id,
            item.data.harvestId,
            item.data.name,
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.crewRepository.save(crew);
        } else if (item.operation === 'delete') {
          await this.crewRepository.delete(item.data.id);
        }
        break;

      case 'weighing':
        if (item.operation === 'create' || item.operation === 'update') {
          const { Weighing } = await import('@domain/weighing/weighing.entity');
          const weighing = Weighing.reconstitute(
            item.data.id,
            item.data.harvestPickerId,
            item.data.kilograms,
            new Date(item.data.dateTime),
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.weighingRepository.save(weighing);
        } else if (item.operation === 'delete') {
          await this.weighingRepository.delete(item.data.id);
        }
        break;

      case 'payment':
        if (item.operation === 'create' || item.operation === 'update') {
          const { Payment } = await import('@domain/payment/payment.entity');
          const payment = Payment.reconstitute(
            item.data.id,
            item.data.harvestPickerId,
            item.data.amount,
            item.data.includesMeals,
            item.data.mealDetail,
            new Date(item.data.dateTime),
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.paymentRepository.save(payment);
        }
        break;

      case 'sale':
        if (item.operation === 'create' || item.operation === 'update') {
          const { Sale } = await import('@domain/sale-and-costs/sale.entity');
          const sale = Sale.reconstitute(
            item.data.id,
            item.data.harvestId,
            item.data.actualDryKilograms,
            item.data.salePrice,
            new Date(item.data.date),
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.saleRepository.save(sale);
        }
        break;

      case 'productionCost':
        if (item.operation === 'create' || item.operation === 'update') {
          const { ProductionCost } = await import('@domain/sale-and-costs/production-cost.entity');
          const cost = ProductionCost.reconstitute(
            item.data.id,
            item.data.harvestId,
            item.data.description,
            item.data.amount,
            new Date(item.data.date),
            new Date(item.data.createdAt),
            new Date(item.data.updatedAt),
          );
          await this.productionCostRepository.save(cost);
        } else if (item.operation === 'delete') {
          await this.productionCostRepository.delete(item.data.id);
        }
        break;

      default:
        throw new Error(`Unknown entity: ${item.entity}`);
    }
  }
}