import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { startOfDayInColombia, startOfWeekInColombia } from '@shared/time/colombia-time';

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
  /** Cómo se le muestra en listas: el alias o nombre + apellido. */
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
        displayName: alias ?? `${picker.worker.firstName} ${picker.worker.lastName}`,
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

  /** true si el trabajador aparece en alguna cosecha (tiene pesadas/pagos asociados o podría tenerlos). */
  async workerHasHarvestHistory(workerId: string): Promise<boolean> {
    const count = await this.prisma.getClient().harvestPicker.count({ where: { workerId } });
    return count > 0;
  }
}
