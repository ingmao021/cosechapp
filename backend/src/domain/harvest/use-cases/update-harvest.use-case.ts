import { Harvest } from '../harvest.entity';
import { HarvestRepository } from '../harvest.repository';
import { HarvestAlreadyClosedError, HarvestHasPaymentsError, HarvestNotActiveError } from '@shared/errors/domain-errors';

export interface UpdateHarvestUseCaseInput {
  harvestId: string;
  name?: string;
  pricePerKilogram?: number;
}

/**
 * Corrige el nombre o el precio por kilo de la cosecha activa. El precio solo cambia mientras
 * no haya pagos: los saldos se calculan con él y cambiarían lo que ya se pagó.
 */
export class UpdateHarvestUseCase {
  constructor(private readonly harvestRepository: HarvestRepository) {}

  async execute(input: UpdateHarvestUseCaseInput): Promise<{ harvest: Harvest }> {
    let harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) throw new HarvestNotActiveError();
    if (!harvest.isActive()) throw new HarvestAlreadyClosedError();

    if (input.name !== undefined) harvest = harvest.rename(input.name);
    if (input.pricePerKilogram !== undefined && input.pricePerKilogram !== harvest.pricePerKilogram) {
      const { payments } = await this.harvestRepository.countRecords(harvest.id);
      if (payments > 0) throw new HarvestHasPaymentsError();
      harvest = harvest.changePrice(input.pricePerKilogram);
    }
    return { harvest: await this.harvestRepository.save(harvest) };
  }
}
