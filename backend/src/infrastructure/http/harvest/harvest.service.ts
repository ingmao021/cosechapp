import { Injectable } from '@nestjs/common';
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
import { FarmRepository } from '@domain/farm/farm.repository';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { HarvestPickerStatus } from '@domain/harvest/harvest-picker-status.enum';

@Injectable()
export class HarvestService {
  constructor(
    private readonly harvestRepository: HarvestRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly crewRepository: CrewRepository,
    private readonly farmRepository: FarmRepository,
    private readonly workerRepository: WorkerRepository,
  ) {}

  async openHarvest(input: { farmId: string; name: string; pricePerKilogram: number }): Promise<Harvest> {
    const useCase = new OpenHarvestUseCase(this.harvestRepository, this.farmRepository);
    const result = await useCase.execute(input);
    return result.harvest;
  }

  async closeHarvest(input: { harvestId: string; farmId: string }): Promise<Harvest> {
    const useCase = new CloseHarvestUseCase(this.harvestRepository);
    const result = await useCase.execute(input);
    return result.harvest;
  }

  async assignWorkerToHarvest(input: { harvestId: string; workerId: string; harvestAlias?: string }): Promise<HarvestWorker> {
    const useCase = new AssignWorkerToHarvestUseCase(
      this.harvestWorkerRepository,
      this.harvestRepository,
      this.workerRepository,
    );
    const result = await useCase.execute(input);
    return result.harvestWorker;
  }

  async archiveWorker(input: { harvestWorkerId: string; harvestId: string }): Promise<HarvestWorker> {
    const useCase = new ArchiveWorkerUseCase(this.harvestWorkerRepository, this.harvestRepository);
    const result = await useCase.execute(input);
    return result.harvestWorker;
  }

  async createCrew(input: { harvestId: string; name: string }): Promise<Crew> {
    const useCase = new CreateCrewUseCase(this.crewRepository, this.harvestRepository);
    const result = await useCase.execute(input);
    return result.crew;
  }

  async getCrew(crewId: string, harvestId: string): Promise<Crew> {
    const useCase = new GetCrewUseCase(this.crewRepository);
    const result = await useCase.execute({ crewId, harvestId });
    return result.crew;
  }

  async listCrews(harvestId: string): Promise<Crew[]> {
    const useCase = new ListCrewsUseCase(this.crewRepository);
    const result = await useCase.execute({ harvestId });
    return result.crews;
  }

  async updateCrew(input: { crewId: string; harvestId: string; name: string }): Promise<Crew> {
    const useCase = new UpdateCrewUseCase(this.crewRepository);
    const result = await useCase.execute(input);
    return result.crew;
  }

  async deleteCrew(crewId: string, harvestId: string): Promise<void> {
    const useCase = new DeleteCrewUseCase(this.crewRepository);
    await useCase.execute({ crewId, harvestId });
  }

  async findActiveByFarmId(farmId: string): Promise<Harvest | null> {
    return this.harvestRepository.findActiveByFarmId(farmId);
  }

  async findAllByFarmId(farmId: string): Promise<Harvest[]> {
    return this.harvestRepository.findAllByFarmId(farmId);
  }

  async findByIdAndFarmId(id: string, farmId: string): Promise<Harvest | null> {
    return this.harvestRepository.findByIdAndFarmId(id, farmId);
  }

  async getHarvestWorkers(harvestId: string): Promise<HarvestWorker[]> {
    return this.harvestWorkerRepository.findAllByHarvestId(harvestId);
  }

  async getActiveHarvestWorkers(harvestId: string): Promise<HarvestWorker[]> {
    return this.harvestWorkerRepository.findAllByHarvestIdAndStatus(harvestId, HarvestPickerStatus.ACTIVE);
  }
}