import { Harvest } from '../harvest.entity';
import { HarvestRepository } from '../harvest.repository';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { PaymentRepository } from '@domain/payment/payment.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { Payment } from '@domain/payment/payment.entity';
import { PickerSettlement, settlementFor } from '@domain/payment/settlement';
import { HarvestNotActiveError, HarvestAlreadyClosedError, BusinessRuleViolationError } from '@shared/errors/domain-errors';

export interface CloseHarvestUseCaseInput {
  harvestId: string;
  farmId: string;
  /** Comida por día que se le cobra a todos (COP); null o sin enviar = sin alimentación. */
  mealPerDay?: number | null;
}

export interface PickerSettlementLine extends PickerSettlement {
  harvestPickerId: string;
}

export interface CloseHarvestPreview {
  pickers: PickerSettlementLine[];
  /** Recolectores a los que se les registra un pago al cerrar. */
  settledPickers: number;
  totalNet: number;
  totalMeals: number;
}

export interface CloseHarvestUseCaseOutput extends CloseHarvestPreview {
  harvest: Harvest;
}

/**
 * Cierra la cosecha liquidando a todos: a cada recolector con saldo se le registra el pago de
 * lo pendiente, menos la comida por día (si el caficultor eligió "con alimentación"). Pagar uno
 * por uno ("Pagar ahora") queda solo para quien se va antes de terminar la cogida.
 * La liquidación y el cierre se guardan juntos (todo o nada).
 */
export class CloseHarvestUseCase {
  constructor(
    private readonly harvestRepository: HarvestRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly weighingRepository: WeighingRepository,
  ) {}

  async preview(input: CloseHarvestUseCaseInput): Promise<CloseHarvestPreview> {
    const harvest = await this.activeHarvest(input);
    return this.settle(harvest, this.parseMealPerDay(input.mealPerDay));
  }

  async execute(input: CloseHarvestUseCaseInput): Promise<CloseHarvestUseCaseOutput> {
    const harvest = await this.activeHarvest(input);
    const preview = await this.settle(harvest, this.parseMealPerDay(input.mealPerDay));

    const closingDate = new Date();
    const payments = preview.pickers
      .filter((line) => line.net > 0 || line.mealDeduction > 0)
      .map((line) =>
        Payment.create(
          crypto.randomUUID(),
          line.harvestPickerId,
          -line.net,
          line.mealDeduction > 0,
          line.mealDeduction > 0 ? String(line.mealDeduction) : null,
          closingDate,
          true,
        ),
      );
    const closed = await this.harvestRepository.closeWithSettlements(harvest.close(closingDate), payments);
    return { ...preview, harvest: closed };
  }

  private async activeHarvest(input: CloseHarvestUseCaseInput): Promise<Harvest> {
    const harvest = await this.harvestRepository.findByIdAndFarmId(input.harvestId, input.farmId);
    if (!harvest) throw new HarvestNotActiveError();
    if (!harvest.isActive()) throw new HarvestAlreadyClosedError();
    return harvest;
  }

  private async settle(harvest: Harvest, mealPerDay: number | null): Promise<CloseHarvestPreview> {
    const pickers = await this.harvestWorkerRepository.findAllByHarvestId(harvest.id);
    const lines = await Promise.all(
      pickers.map(async (picker): Promise<PickerSettlementLine> => {
        const [totalKilograms, payments, weighings] = await Promise.all([
          this.weighingRepository.getTotalKilogramsByHarvestPickerId(picker.id),
          this.paymentRepository.findAllByHarvestPickerId(picker.id),
          this.weighingRepository.findAllByHarvestPickerId(picker.id),
        ]);
        const settlement = settlementFor({
          totalKilograms,
          pricePerKilogram: harvest.pricePerKilogram,
          payments,
          weighings,
          mealPerDay,
        });
        return { harvestPickerId: picker.id, ...settlement };
      }),
    );
    const settled = lines.filter((line) => line.pending > 0);
    return {
      pickers: lines,
      settledPickers: settled.length,
      totalNet: settled.reduce((sum, line) => sum + line.net, 0),
      totalMeals: settled.reduce((sum, line) => sum + line.mealDeduction, 0),
    };
  }

  private parseMealPerDay(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    if (!Number.isFinite(value) || value <= 0) {
      throw new BusinessRuleViolationError('Meal value per day must be a positive number');
    }
    return Math.round(value);
  }
}
