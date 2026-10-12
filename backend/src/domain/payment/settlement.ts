import { Payment } from './payment.entity';
import { Weighing } from '@domain/weighing/weighing.entity';
import { countMealDays, settledAmounts } from './use-cases/pay-now.use-case';

/** Lo que se le liquida a un recolector al cerrar la cosecha. Montos en positivo (COP). */
export interface PickerSettlement {
  totalKilograms: number;
  /** Kilos × precio de la cosecha. */
  gross: number;
  /** Efectivo ya pagado (ej. cuando se fue antes). */
  alreadyPaid: number;
  /** Comida ya descontada en pagos anteriores. */
  previousMealDeductions: number;
  /** Lo que se le debía antes de la comida de este cierre. */
  pending: number;
  /** Días con pesadas desde su último pago (null si no hubo alimentación). */
  mealDays: number | null;
  /** Comida de este cierre: días × valor por día, sin pasar de lo pendiente. */
  mealDeduction: number;
  /** Efectivo que recibe al cierre. */
  net: number;
}

/**
 * Liquidación de un recolector: lo pendiente (kilos × precio − lo ya pagado − la comida ya
 * descontada) menos la comida por día desde su último pago. La comida nunca deja el neto en
 * negativo: si cubre todo lo pendiente, el neto es 0.
 */
export function settlementFor(input: {
  totalKilograms: number;
  pricePerKilogram: number;
  payments: Payment[];
  weighings: Weighing[];
  mealPerDay: number | null;
}): PickerSettlement {
  const { alreadyPaid, previousMealDeductions } = settledAmounts(input.payments);
  const gross = input.totalKilograms * input.pricePerKilogram;
  const pending = Math.max(0, gross - alreadyPaid - previousMealDeductions);
  const mealDays = input.mealPerDay === null ? null : countMealDays(input.weighings, input.payments);
  const mealDeduction = mealDays ? Math.min(pending, mealDays * input.mealPerDay!) : 0;
  return {
    totalKilograms: input.totalKilograms,
    gross,
    alreadyPaid,
    previousMealDeductions,
    pending,
    mealDays,
    mealDeduction,
    net: pending - mealDeduction,
  };
}
