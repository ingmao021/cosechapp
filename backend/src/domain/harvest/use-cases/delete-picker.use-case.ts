import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { PickerHasRecordsError, PickerNotFoundError } from '@shared/errors/domain-errors';

/**
 * Quita a un recolector de la cosecha (ej. se agregó por error). Solo si no tiene pesadas ni
 * pagos; si ya los tiene, se archiva para conservar ese registro.
 */
export class DeletePickerUseCase {
  constructor(private readonly harvestWorkerRepository: HarvestWorkerRepository) {}

  async execute(input: { harvestId: string; pickerId: string }): Promise<void> {
    const picker = await this.harvestWorkerRepository.findByIdAndHarvestId(input.pickerId, input.harvestId);
    if (!picker) throw new PickerNotFoundError(input.pickerId);

    const { weighings, payments } = await this.harvestWorkerRepository.countRecords(picker.id);
    if (weighings > 0 || payments > 0) throw new PickerHasRecordsError();
    await this.harvestWorkerRepository.delete(picker.id);
  }
}
