import { HarvestRepository } from '../harvest.repository';
import { HarvestAlreadyClosedError, HarvestHasRecordsError, HarvestNotActiveError } from '@shared/errors/domain-errors';

/**
 * Elimina la cosecha activa (ej. se creó por error). Solo si aún no tiene pesadas ni pagos;
 * si ya los tiene, se cierra con "Cerrar cosecha" para no perder ese registro.
 */
export class DeleteHarvestUseCase {
  constructor(private readonly harvestRepository: HarvestRepository) {}

  async execute(input: { harvestId: string }): Promise<void> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) throw new HarvestNotActiveError();
    if (!harvest.isActive()) throw new HarvestAlreadyClosedError();

    const { weighings, payments } = await this.harvestRepository.countRecords(harvest.id);
    if (weighings > 0 || payments > 0) throw new HarvestHasRecordsError();
    await this.harvestRepository.delete(harvest.id);
  }
}
