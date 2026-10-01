import { Inject, Injectable } from '@nestjs/common';
import { Harvest } from '@domain/harvest/harvest.entity';
import { HarvestWorker } from '@domain/harvest/harvest-worker.entity';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { CatalogWorker } from '@domain/worker/worker.entity';
import { WorkerRepository } from '@domain/worker/worker.repository';
import { ResourceNotFoundError } from '@shared/errors/domain-errors';

/**
 * Verifica que un recurso pedido por id pertenezca al usuario autenticado.
 * Si no existe o es de otro usuario responde lo mismo (404): así no se revela
 * que el recurso existe.
 */
@Injectable()
export class OwnershipService {
  constructor(
    @Inject('HARVEST_REPOSITORY') private readonly harvestRepository: HarvestRepository,
    @Inject('HARVEST_WORKER_REPOSITORY') private readonly harvestWorkerRepository: HarvestWorkerRepository,
    @Inject('WORKER_REPOSITORY') private readonly workerRepository: WorkerRepository,
  ) {}

  async harvestFor(harvestId: string, farmId: string): Promise<Harvest> {
    const harvest = await this.harvestRepository.findByIdAndFarmId(harvestId, farmId);
    if (!harvest) {
      throw new ResourceNotFoundError('Harvest not found');
    }
    return harvest;
  }

  async pickerFor(harvestPickerId: string, farmId: string): Promise<{ picker: HarvestWorker; harvest: Harvest }> {
    const picker = await this.harvestWorkerRepository.findById(harvestPickerId);
    const harvest = picker && (await this.harvestRepository.findByIdAndFarmId(picker.harvestId, farmId));
    if (!picker || !harvest) {
      throw new ResourceNotFoundError('Harvest picker not found');
    }
    return { picker, harvest };
  }

  async workerFor(workerId: string, coffeeGrowerId: string): Promise<CatalogWorker> {
    const worker = await this.workerRepository.findByIdAndCoffeeGrowerId(workerId, coffeeGrowerId);
    if (!worker) {
      throw new ResourceNotFoundError('Worker not found');
    }
    return worker;
  }
}
