import { Injectable, Inject } from '@nestjs/common';
import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestWorker } from '@domain/harvest/harvest-worker.entity';
import { Crew } from '@domain/harvest/crew.entity';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { CrewRepository } from '@domain/harvest/crew.repository';
import { OpenHarvestUseCase } from '@domain/harvest/use-cases/open-harvest.use-case';
import { CloseHarvestUseCase } from '@domain/harvest/use-cases/close-harvest.use-case';
import { AssignWorkerToHarvestUseCase } from '@domain/harvest/use-cases/assign-worker.use-case';
import { ArchiveWorkerUseCase } from '@domain/harvest/use-cases/archive-worker.use-case';
import { CreateCrewUseCase } from '@domain/harvest/use-cases/create-crew.use-case';
import { GetCrewUseCase } from '@domain/harvest/use-cases/get-crew.use-case';
import { ListCrewsUseCase } from '@domain/harvest/use-cases/list-crews.use-case';
import { UpdateCrewUseCase } from '@domain/harvest/use-cases/update-crew.use-case';
import { DeleteCrewUseCase } from '@domain/harvest/use-cases/delete-crew.use-case';
import { GetHarvestProfitUseCase } from '@domain/sale-and-costs/use-cases/get-harvest-profit.use-case';
import { FarmRepository } from '@domain/farm/farm.repository';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { SaleRepository } from '@domain/sale-and-costs/sale.repository';
import { ProductionCostRepository } from '@domain/sale-and-costs/production-cost.repository';
import { OwnershipService } from '@infrastructure/http/ownership.service';
import { PickerStats, PrismaHarvestQueries } from '@infrastructure/persistence/prisma-harvest-queries';

/** Usuario autenticado, tal como lo deja JwtStrategy en req.user. */
export interface AuthUser {
  userId: string;
  nationalId: string;
  farmId: string;
}

@Injectable()
export class HarvestService {
  constructor(
    @Inject('HARVEST_REPOSITORY') private readonly harvestRepository: HarvestRepository,
    @Inject('HARVEST_WORKER_REPOSITORY') private readonly harvestWorkerRepository: HarvestWorkerRepository,
    @Inject('CREW_REPOSITORY') private readonly crewRepository: CrewRepository,
    @Inject('FARM_REPOSITORY') private readonly farmRepository: FarmRepository,
    @Inject('WORKER_REPOSITORY') private readonly workerRepository: WorkerRepository,
    @Inject('WEIGHING_REPOSITORY') private readonly weighingRepository: WeighingRepository,
    @Inject('PAYMENT_REPOSITORY') private readonly paymentRepository: PaymentRepository,
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
    @Inject('PRODUCTION_COST_REPOSITORY') private readonly productionCostRepository: ProductionCostRepository,
    private readonly ownership: OwnershipService,
    private readonly queries: PrismaHarvestQueries,
  ) {}

  async openHarvest(user: AuthUser, input: { name: string; pricePerKilogram: number }): Promise<Harvest> {
    const useCase = new OpenHarvestUseCase(this.harvestRepository, this.farmRepository);
    const result = await useCase.execute({ ...input, farmId: user.farmId });
    return result.harvest;
  }

  async closeHarvest(user: AuthUser, harvestId: string): Promise<Harvest> {
    await this.ownership.harvestFor(harvestId, user.farmId);
    const useCase = new CloseHarvestUseCase(this.harvestRepository);
    const result = await useCase.execute({ harvestId, farmId: user.farmId });
    return result.harvest;
  }

  async assignWorkerToHarvest(
    user: AuthUser,
    input: { harvestId: string; workerId: string; harvestAlias?: string; crewId?: string },
  ): Promise<{ harvestWorker: HarvestWorker; created: boolean }> {
    await this.ownership.harvestFor(input.harvestId, user.farmId);
    await this.ownership.workerFor(input.workerId, user.userId);
    const useCase = new AssignWorkerToHarvestUseCase(
      this.harvestWorkerRepository,
      this.harvestRepository,
      this.workerRepository,
      this.crewRepository,
    );
    return useCase.execute(input);
  }

  async archiveWorker(user: AuthUser, input: { harvestWorkerId: string; harvestId: string }): Promise<HarvestWorker> {
    await this.ownership.harvestFor(input.harvestId, user.farmId);
    const useCase = new ArchiveWorkerUseCase(this.harvestWorkerRepository, this.harvestRepository);
    const result = await useCase.execute(input);
    return result.harvestWorker;
  }

  async createCrew(user: AuthUser, input: { harvestId: string; name: string }): Promise<Crew> {
    await this.ownership.harvestFor(input.harvestId, user.farmId);
    const useCase = new CreateCrewUseCase(this.crewRepository, this.harvestRepository);
    const result = await useCase.execute(input);
    return result.crew;
  }

  async getCrew(user: AuthUser, crewId: string, harvestId: string): Promise<Crew> {
    await this.ownership.harvestFor(harvestId, user.farmId);
    const useCase = new GetCrewUseCase(this.crewRepository);
    const result = await useCase.execute({ crewId, harvestId });
    return result.crew;
  }

  async listCrews(user: AuthUser, harvestId: string): Promise<Crew[]> {
    await this.ownership.harvestFor(harvestId, user.farmId);
    const useCase = new ListCrewsUseCase(this.crewRepository);
    const result = await useCase.execute({ harvestId });
    return result.crews;
  }

  async updateCrew(user: AuthUser, input: { crewId: string; harvestId: string; name: string }): Promise<Crew> {
    await this.ownership.harvestFor(input.harvestId, user.farmId);
    const useCase = new UpdateCrewUseCase(this.crewRepository);
    const result = await useCase.execute(input);
    return result.crew;
  }

  async deleteCrew(user: AuthUser, crewId: string, harvestId: string): Promise<void> {
    await this.ownership.harvestFor(harvestId, user.farmId);
    const useCase = new DeleteCrewUseCase(this.crewRepository);
    await useCase.execute({ crewId, harvestId });
  }

  async findActive(user: AuthUser): Promise<Harvest | null> {
    return this.harvestRepository.findActiveByFarmId(user.farmId);
  }

  /** Cosechas de la finca; las cerradas traen su ganancia (para el historial). */
  async findAll(user: AuthUser): Promise<Array<{ harvest: Harvest; actualProfit: number | null }>> {
    const harvests = await this.harvestRepository.findAllByFarmId(user.farmId);
    const profitUseCase = this.profitUseCase();
    return Promise.all(
      harvests.map(async (harvest) => ({
        harvest,
        actualProfit: harvest.isClosed()
          ? (await profitUseCase.execute({ harvestId: harvest.id })).actualProfit
          : null,
      })),
    );
  }

  async findOne(user: AuthUser, harvestId: string): Promise<Harvest> {
    return this.ownership.harvestFor(harvestId, user.farmId);
  }

  /** Recolectores con nombre y acumulados (hoy, semana, ciclo, pagado, saldo). */
  async pickerStats(user: AuthUser, harvestId: string, onlyActive: boolean): Promise<PickerStats[]> {
    const harvest = await this.ownership.harvestFor(harvestId, user.farmId);
    return this.queries.pickerStats(harvest.id, harvest.pricePerKilogram, onlyActive);
  }

  /** Todo lo de una cosecha para el historial: recolectores, venta, costos y ganancias. */
  async detail(user: AuthUser, harvestId: string) {
    const harvest = await this.ownership.harvestFor(harvestId, user.farmId);
    const profitUseCase = this.profitUseCase();
    const [pickers, crews, sale, costs, profit] = await Promise.all([
      this.queries.pickerStats(harvest.id, harvest.pricePerKilogram),
      this.crewRepository.findAllByHarvestId(harvest.id),
      this.saleRepository.findByHarvestId(harvest.id),
      this.productionCostRepository.findAllByHarvestId(harvest.id),
      profitUseCase.execute({ harvestId: harvest.id }),
    ]);

    return {
      harvest,
      pickers,
      crews,
      totalCherryKilograms: pickers.reduce((sum, picker) => sum + picker.totalKilograms, 0),
      totalPayments: pickers.reduce((sum, picker) => sum + picker.totalPaid, 0),
      sale,
      costs,
      grossProfit: profit.grossProfit,
      actualProfit: profit.actualProfit,
    };
  }

  private profitUseCase(): GetHarvestProfitUseCase {
    return new GetHarvestProfitUseCase(
      this.saleRepository,
      this.paymentRepository,
      this.weighingRepository,
      this.harvestWorkerRepository,
      this.harvestRepository,
      this.productionCostRepository,
    );
  }
}
