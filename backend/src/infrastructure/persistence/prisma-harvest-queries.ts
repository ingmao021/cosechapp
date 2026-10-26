import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { colombiaDateKey, startOfDayInColombia, startOfWeekInColombia } from '@shared/time/colombia-time';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Días del gráfico de Inicio (hoy y los 6 anteriores). */
const DASHBOARD_DAYS = 7;
/** Movimientos que trae "Actividad reciente". */
const RECENT_ACTIVITY = 10;

/** Cómo se le muestra a un recolector en listas: el alias o el nombre (más el apellido, si lo tiene). */
function displayNameOf(picker: { harvestAlias: string | null; worker: { firstName: string; lastName: string; alias: string | null } }) {
  const alias = picker.harvestAlias ?? picker.worker.alias ?? null;
  return { alias, displayName: alias ?? `${picker.worker.firstName} ${picker.worker.lastName}`.trim() };
}

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

/** Un movimiento de la cosecha para "Actividad reciente" en Inicio. Montos en positivo. */
export type HarvestActivity =
  | { type: 'weighing'; id: string; pickerId: string; displayName: string; kilograms: number; dateTime: Date }
  | {
      type: 'payment';
      id: string;
      pickerId: string;
      displayName: string;
      /** Efectivo recibido. */
      amount: number;
      mealDeduction: number;
      isSettlement: boolean;
      dateTime: Date;
    };

/** Lo que Inicio no puede sacar de los recolectores: kilos por día, últimos movimientos y costos. */
export interface HarvestDashboard {
  /** Hoy y los 6 días anteriores (hora de Colombia), del más antiguo al más reciente; 0 si no hubo pesadas. */
  dailyKilograms: Array<{ date: string; kilograms: number }>;
  /** Últimas pesadas y pagos, del más reciente al más antiguo. */
  recentActivity: HarvestActivity[];
  /** Costos de producción, en positivo (con la cosecha abierta todavía no hay). */
  productionCosts: number;
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
      const { alias, displayName } = displayNameOf(picker);
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
        displayName,
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
      const day = colombiaDateKey(record.dateTime);
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

    return {
      pickerId: picker.id,
      displayName: displayNameOf(picker).displayName,
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

  async dashboard(harvestId: string, now = new Date()): Promise<HarvestDashboard> {
    const client = this.prisma.getClient();
    const pickerFilter = { harvestPicker: { harvestId } };
    const firstDay = new Date(startOfDayInColombia(now).getTime() - (DASHBOARD_DAYS - 1) * DAY_MS);
    const withPicker = { harvestPicker: { include: { worker: true } } };

    const [weekRecords, weighings, payments, costs] = await Promise.all([
      client.weightRecord.findMany({
        where: { ...pickerFilter, dateTime: { gte: firstDay } },
        select: { kilograms: true, dateTime: true },
      }),
      client.weightRecord.findMany({ where: pickerFilter, include: withPicker, orderBy: { dateTime: 'desc' }, take: RECENT_ACTIVITY }),
      client.payment.findMany({ where: pickerFilter, include: withPicker, orderBy: { dateTime: 'desc' }, take: RECENT_ACTIVITY }),
      client.productionCost.aggregate({ where: { harvestId }, _sum: { amount: true } }),
    ]);

    const byDay = new Map<string, number>();
    for (const record of weekRecords) {
      const day = colombiaDateKey(record.dateTime);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(record.kilograms));
    }
    const dailyKilograms = Array.from({ length: DASHBOARD_DAYS }, (_, index) => {
      const date = colombiaDateKey(new Date(firstDay.getTime() + index * DAY_MS));
      return { date, kilograms: byDay.get(date) ?? 0 };
    });

    const recentActivity: HarvestActivity[] = [
      ...weighings.map((record) => ({
        type: 'weighing' as const,
        id: record.id,
        pickerId: record.harvestPickerId,
        displayName: displayNameOf(record.harvestPicker).displayName,
        kilograms: Number(record.kilograms),
        dateTime: record.dateTime,
      })),
      ...payments.map((payment) => ({
        type: 'payment' as const,
        id: payment.id,
        pickerId: payment.harvestPickerId,
        displayName: displayNameOf(payment.harvestPicker).displayName,
        amount: -Number(payment.amount), // se guardan en negativo
        mealDeduction: payment.includesMeals ? Number(payment.mealDetail) || 0 : 0,
        isSettlement: payment.isSettlement,
        dateTime: payment.dateTime,
      })),
    ]
      .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())
      .slice(0, RECENT_ACTIVITY);

    return { dailyKilograms, recentActivity, productionCosts: -Number(costs._sum.amount ?? 0) };
  }

  /** true si el trabajador aparece en alguna cosecha (tiene pesadas/pagos asociados o podría tenerlos). */
  async workerHasHarvestHistory(workerId: string): Promise<boolean> {
    const count = await this.prisma.getClient().harvestPicker.count({ where: { workerId } });
    return count > 0;
  }
}
