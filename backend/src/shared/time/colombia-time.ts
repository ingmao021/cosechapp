/**
 * "Hoy" y "esta semana" en hora de Colombia (UTC−5, sin horario de verano),
 * independiente de la zona horaria del servidor (en producción suele ser UTC).
 */
const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;

/** Instante (UTC) en que empezó el día actual en Colombia. */
export function startOfDayInColombia(now: Date = new Date()): Date {
  const local = new Date(now.getTime() + COLOMBIA_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - COLOMBIA_OFFSET_MS);
}

/** Instante (UTC) en que empezó la semana actual (lunes 00:00) en Colombia. */
export function startOfWeekInColombia(now: Date = new Date()): Date {
  const dayStart = startOfDayInColombia(now);
  const localWeekday = new Date(dayStart.getTime() + COLOMBIA_OFFSET_MS).getUTCDay(); // 0 = domingo
  const daysSinceMonday = (localWeekday + 6) % 7;
  return new Date(dayStart.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
}
