import { Payment } from '../payment.entity';
import { PaymentRepository } from '../payment.repository';
import { WeighingRepository } from '@domain/weighing/weighing.repository';
import { HarvestWorkerRepository } from '@domain/harvest/harvest-worker.repository';
import { HarvestRepository } from '@domain/harvest/harvest.repository';
import { PaymentCalculatorStrategy } from '../payment-calculator';
import { BusinessRuleViolationError, ResourceNotFoundError } from '@shared/errors/domain-errors';
import { Weighing } from '@domain/weighing/weighing.entity';
import { startOfDayInColombia } from '@shared/time/colombia-time';

export interface PayNowUseCaseInput {
  harvestPickerId: string;
  harvestId: string;
  includesMeals: boolean;
  /**
   * Lo que el caficultor cobra de alimentación por día (COP). Se descuenta una vez por cada día
   * con pesadas desde el último pago. Tiene prioridad sobre mealDetail.
   */
  mealPerDay?: number | null;
  /** Valor total a descontar por alimentación, como texto numérico (ej. "5000"). Apps anteriores. */
  mealDetail: string | null;
}

/** Desglose del pago pendiente de un recolector. Montos positivos, en COP. */
export interface PaymentPreview {
  totalKilograms: number;
  /** Kilos × precio de la cosecha, de todo el ciclo. */
  gross: number;
  /** Dinero que ya se le pagó en esta cosecha. */
  alreadyPaid: number;
  /** Alimentación descontada en pagos anteriores (también cuenta como saldada). */
  previousMealDeductions: number;
  /** Alimentación a descontar en este pago (días × valor por día). */
  mealDeduction: number;
  /** Días con pesadas desde el último pago (null si no se pidió por día). */
  mealDays: number | null;
  /** Valor por día que se cobró (null si no se pidió por día). */
  mealPerDay: number | null;
  /** Lo que se le paga ahora: gross − alreadyPaid − previousMealDeductions − mealDeduction. */
  net: number;
}

/** Lo ya saldado a un recolector: dinero pagado + alimentación descontada. Montos en positivo. */
export function settledAmounts(payments: Payment[]): { alreadyPaid: number; previousMealDeductions: number } {
  return payments.reduce(
    (acc, payment) => ({
      alreadyPaid: acc.alreadyPaid - payment.amount, // los pagos se guardan en negativo
      previousMealDeductions:
        acc.previousMealDeductions + (payment.includesMeals ? Number(payment.mealDetail) || 0 : 0),
    }),
    { alreadyPaid: 0, previousMealDeductions: 0 },
  );
}

export interface PayNowUseCaseOutput {
  payment: Payment;
  totalKilograms: number;
  amountDue: number;
}

export class PayNowUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly weighingRepository: WeighingRepository,
    private readonly harvestWorkerRepository: HarvestWorkerRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly paymentCalculator: PaymentCalculatorStrategy,
  ) {}

  /**
   * Calcula cuánto se le debe hoy al recolector. Solo paga lo pendiente: los pagos
   * anteriores ya cubrieron sus kilos, así que no se vuelven a pagar.
   */
  async preview(input: PayNowUseCaseInput): Promise<PaymentPreview> {
    const harvest = await this.harvestRepository.findById(input.harvestId);
    if (!harvest) {
      throw new ResourceNotFoundError('Harvest not found');
    }
    if (!harvest.isActive()) {
      throw new BusinessRuleViolationError('Cannot pay in a closed harvest');
    }

    const harvestWorker = await this.harvestWorkerRepository.findByIdAndHarvestId(
      input.harvestPickerId,
      input.harvestId,
    );
    if (!harvestWorker) {
      throw new ResourceNotFoundError('Harvest picker not found in this harvest');
    }
    if (!harvestWorker.isActive()) {
      throw new BusinessRuleViolationError('Cannot pay an archived picker');
    }

    const [totalKilograms, previousPayments, weighings] = await Promise.all([
      this.weighingRepository.getTotalKilogramsByHarvestPickerId(input.harvestPickerId),
      this.paymentRepository.findAllByHarvestPickerId(input.harvestPickerId),
      this.weighingRepository.findAllByHarvestPickerId(input.harvestPickerId),
    ]);
    const mealPerDay = input.includesMeals ? this.parseMealPerDay(input.mealPerDay) : null;
    const mealDays = mealPerDay === null ? null : countMealDays(weighings, previousPayments);
    const mealDeduction = mealPerDay === null || mealDays === null ? this.parseMealDeduction(input) : mealDays * mealPerDay;
    const { alreadyPaid, previousMealDeductions } = settledAmounts(previousPayments);
    const gross = -this.paymentCalculator.calculate(totalKilograms, harvest.pricePerKilogram, false, null);
    // La alimentación ya descontada también quedó saldada: no se vuelve a pagar.
    const pending = gross - alreadyPaid - previousMealDeductions;

    if (pending <= 0) {
      throw new BusinessRuleViolationError('Nothing to pay for this picker');
    }
    if (mealDeduction >= pending) {
      throw new BusinessRuleViolationError('Meal deduction must be less than the amount due');
    }

    return {
      totalKilograms,
      gross,
      alreadyPaid,
      previousMealDeductions,
      mealDeduction,
      mealDays,
      mealPerDay,
      net: pending - mealDeduction,
    };
  }

  async execute(input: PayNowUseCaseInput): Promise<PayNowUseCaseOutput> {
    const preview = await this.preview(input);

    const payment = Payment.create(
      crypto.randomUUID(),
      input.harvestPickerId,
      -preview.net,
      // Se guarda el total descontado: es lo que suman los saldos (settledAmounts).
      preview.mealDeduction > 0,
      preview.mealDeduction > 0 ? String(preview.mealDeduction) : null,
    );
    const saved = await this.paymentRepository.save(payment);

    return { payment: saved, totalKilograms: preview.totalKilograms, amountDue: preview.net };
  }

  private parseMealPerDay(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    if (!Number.isFinite(value) || value < 0) {
      throw new BusinessRuleViolationError('Meal value per day must be a positive number');
    }
    return Math.round(value);
  }

  private parseMealDeduction(input: PayNowUseCaseInput): number {
    if (!input.includesMeals || !input.mealDetail) return 0;
    const value = Number(input.mealDetail);
    if (!Number.isFinite(value) || value < 0) {
      throw new BusinessRuleViolationError('Meal deduction must be a positive number');
    }
    return value;
  }
}

/**
 * Días (en hora de Colombia) con pesadas desde el último pago: cada uno es un día de comida.
 * Si el último pago fue un día en que ya había pesado, ese día ya se cobró y no se repite.
 */
export function countMealDays(weighings: Weighing[], payments: Payment[]): number {
  const lastPayment = payments.reduce<Date | null>(
    (latest, payment) => (!latest || payment.dateTime > latest ? payment.dateTime : latest),
    null,
  );
  const dayOf = (date: Date) => startOfDayInColombia(date).getTime();
  const days = new Set(
    weighings.filter((w) => !lastPayment || w.dateTime > lastPayment).map((w) => dayOf(w.dateTime)),
  );
  if (lastPayment) {
    const paidDay = dayOf(lastPayment);
    const alreadyCounted = weighings.some((w) => w.dateTime <= lastPayment && dayOf(w.dateTime) === paidDay);
    if (alreadyCounted) days.delete(paidDay);
  }
  return days.size;
}
