import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { startOfDayInColombia, startOfWeekInColombia } from '@shared/time/colombia-time';

const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;

/** Recolector de una cosecha con su nombre y acumulados, listo para mostrar. */
export interface PickerStats {
  id: string;
  harvestId: string;
  workerId: string;
  crewId: string | null;
  status: 'active' | 'archived';
  firstName: string;
  lastName: string;
  /** Alias en la cosecha o, si no tiene, el del catálogo. */
  alias: string | null;
  /** Cómo se le muestra en listas: el alias o el nombre (más el apellido, si lo tiene). */
  displayName: string;
  todayKilograms: number;
  weekKilograms: number;
  totalKilograms: number;
  /** Dinero pagado en esta cosecha, en positivo. */
  totalPaid: number;
  /** Alimentación descontada en los pagos. */
  totalMealDeductions: number;
  /** Kilos × precio − pagado − alimentación descontada. */
  balanceDue: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Detalle de un recolector para el historial: kilos por día, pagos y total. Montos en positivo. */
export interface PickerStatement {
  pickerId: string;
  displayName: string;
  status: 'active' | 'archived';
  pricePerKilogram: number;
  /** Un registro por día con pesadas (hora de Colombia), del más antiguo al más reciente. */
  days: Array<{ date: string; kilograms: number; amount: number }>;
  totalKilograms: number;
  /** Kilos × precio. */
  gross: number;
  payments: Array<{ id: string; dateTime: Date; amount: number; mealDeduction: number; isSettlement: boolean }>;
  /** Efectivo recibido. */
  totalPaid: number;
  /** Comida descontada. */
  totalMeals: number;
  /** Lo que ganó el trabajador: efectivo + comida descontada. */
  total: number;
  /** Lo que quedó sin pagar (solo cosechas cerradas antes de liquidar al cierre). */
  balanceDue: number;
}

/**
 * Consultas de lectura para pantallas (lado de lectura, CQRS). Agregan en la base
 * de datos con un número fijo de consultas, sin importar cuántos recolectores haya.
 */
@Injectable()
export class PrismaHarvestQueries {
  constructor(private readonly prisma: PrismaService) {}

  async pickerStats(harvestId: string, pricePerKilogram: number, onlyActive = false, now = new Date()): Promise<PickerStats[]> {
    const client = this.prisma.getClient();
    const pickerFilter = { harvestPicker: { harvestId } };

    const [pickers, total, today, week, paid] = await Promise.all([
      client.harvestPicker.findMany({
        where: { harvestId, ...(onlyActive ? { status: 'ACTIVE' as const } : {}) },
        include: { worker: true },
        orderBy: { createdAt: 'asc' },
      }),
      client.weightRecord.groupBy({ by: ['harvestPickerId'], where: pickerFilter, _sum: { kilograms: true } }),
      client.weightRecord.groupBy({
        by: ['harvestPickerId'],
        where: { ...pickerFilter, dateTime: { gte: startOfDayInColombia(now) } },
        _sum: { kilograms: true },
      }),
      client.weightRecord.groupBy({
        by: ['harvestPickerId'],
        where: { ...pickerFilter, dateTime: { gte: startOfWeekInColombia(now) } },
        _sum: { kilograms: true },
      }),
      // Sin groupBy: la alimentación descontada se guarda como texto (mealDetail).
      client.payment.findMany({
        where: pickerFilter,
        select: { harvestPickerId: true, amount: true, includesMeals: true, mealDetail: true },
      }),
    ]);

    const sumBy = (rows: Array<{ harvestPickerId: string; _sum: Record<string, unknown> }>, field: string) =>
      new Map(rows.map((row) => [row.harvestPickerId, Number(row._sum[field] ?? 0)]));
    const totalKg = sumBy(total, 'kilograms');
    const todayKg = sumBy(today, 'kilograms');
    const weekKg = sumBy(week, 'kilograms');
    const settled = new Map<string, { paid: number; meals: number }>();
    for (const payment of paid) {
      const current = settled.get(payment.harvestPickerId) ?? { paid: 0, meals: 0 };
      current.paid -= Number(payment.amount); // los pagos se guardan en negativo
      current.meals += payment.includesMeals ? Number(payment.mealDetail) || 0 : 0;
      settled.set(payment.harvestPickerId, current);
    }

    return pickers.map((picker) => {
      const alias = picker.harvestAlias ?? picker.worker.alias ?? null;
      const totalKilograms = totalKg.get(picker.id) ?? 0;
      const { paid: totalPaid, meals: totalMealDeductions } = settled.get(picker.id) ?? { paid: 0, meals: 0 };
      return {
        id: picker.id,
        harvestId: picker.harvestId,
        workerId: picker.workerId,
        crewId: picker.crewId,
        status: picker.status === 'ACTIVE' ? 'active' : 'archived',
        firstName: picker.worker.firstName,
        lastName: picker.worker.lastName,
        alias,
        displayName: alias ?? `${picker.worker.firstName} ${picker.worker.lastName}`.trim(),
        todayKilograms: todayKg.get(picker.id) ?? 0,
        weekKilograms: weekKg.get(picker.id) ?? 0,
        totalKilograms,
        totalPaid,
        totalMealDeductions,
        balanceDue: Math.max(0, totalKilograms * pricePerKilogram - totalPaid - totalMealDeductions),
        createdAt: picker.createdAt,
        updatedAt: picker.updatedAt,
      };
    });
  }

  async pickerStatement(harvestId: string, pickerId: string, pricePerKilogram: number): Promise<PickerStatement | null> {
    const client = this.prisma.getClient();
    const picker = await client.harvestPicker.findFirst({
      where: { id: pickerId, harvestId },
      include: { worker: true, weightRecords: { orderBy: { dateTime: 'asc' } }, payments: { orderBy: { dateTime: 'asc' } } },
    });
    if (!picker) return null;

    // Kilos por día en hora de Colombia ("AAAA-MM-DD").
    const byDay = new Map<string, number>();
    for (const record of picker.weightRecords) {
      const day = new Date(startOfDayInColombia(record.dateTime).getTime() + COLOMBIA_OFFSET_MS).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(record.kilograms));
    }
    const days = [...byDay].map(([date, kilograms]) => ({ date, kilograms, amount: kilograms * pricePerKilogram }));
    const totalKilograms = days.reduce((sum, day) => sum + day.kilograms, 0);
    const gross = totalKilograms * pricePerKilogram;

    const payments = picker.payments.map((payment) => ({
      id: payment.id,
      dateTime: payment.dateTime,
      amount: -Number(payment.amount), // se guardan en negativo
      mealDeduction: payment.includesMeals ? Number(payment.mealDetail) || 0 : 0,
      isSettlement: payment.isSettlement,
    }));
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalMeals = payments.reduce((sum, payment) => sum + payment.mealDeduction, 0);
    const alias = picker.harvestAlias ?? picker.worker.alias ?? null;

    return {
      pickerId: picker.id,
      displayName: alias ?? `${picker.worker.firstName} ${picker.worker.lastName}`.trim(),
      status: picker.status === 'ACTIVE' ? 'active' : 'archived',
      pricePerKilogram,
      days,
      totalKilograms,
      gross,
      payments,
      totalPaid,
      totalMeals,
      total: totalPaid + totalMeals,
      balanceDue: Math.max(0, gross - totalPaid - totalMeals),
    };
  }

  /** true si el trabajador aparece en alguna cosecha (tiene pesadas/pagos asociados o podría tenerlos). */
  async workerHasHarvestHistory(workerId: string): Promise<boolean> {
    const count = await this.prisma.getClient().harvestPicker.count({ where: { workerId } });
    return count > 0;
  }
}
