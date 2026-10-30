// Utilidades compartidas - placeholder para futuras utilidades
export const formatKilos = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '0 kg';
  const rounded = Math.round(value * 1000) / 1000;
  const parts = rounded.toString().split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1] ? `,${parts[1]}` : '';
  return `${integerPart}${decimalPart} kg`;
};

export const formatCurrency = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '$ 0 COP';
  const rounded = Math.round(value);
  const formatted = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${rounded < 0 ? '−' : ''}$ ${formatted} COP`;
};

/*
 * Números que escribe el usuario (Design System §2.6 Formulario): al digitar no se usa
 * punto; en los resultados, sí (punto de miles y coma decimal, con los pipes). Así
 * "18.500", escrito a la colombiana, nunca se toma como 18,5.
 */

/** Más dígitos que esto no son un monto real (y JavaScript los perdería). */
const MAX_INTEGER_DIGITS = 12;
const MAX_DECIMALS = 3;

/** Montos en pesos al escribir: solo dígitos, sin ceros a la izquierda ("18.500" → "18500"). */
export const sanitizeInteger = (text: string): string =>
  text.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_INTEGER_DIGITS);

/** Monto escrito → entero, o null si no hay dígitos. */
export const parseInteger = (text: string | null | undefined): number | null => {
  const digits = sanitizeInteger(text ?? '');
  return digits === '' ? null : Number(digits);
};

/**
 * Kilos al escribir: dígitos y una sola coma decimal (con hasta 3 decimales). Un punto
 * se toma como esa coma ("25.5" → "25,5"), para que nunca se cuele un 255.
 */
export const sanitizeDecimal = (text: string): string => {
  const [whole, ...rest] = text.replace(/\./g, ',').replace(/[^\d,]/g, '').split(',');
  const integer = whole.replace(/^0+(?=\d)/, '').slice(0, MAX_INTEGER_DIGITS);
  if (rest.length === 0) return integer;
  return `${integer || '0'},${rest.join('').slice(0, MAX_DECIMALS)}`;
};

/** Kilos escritos → número, o null si no hay dígitos. */
export const parseDecimal = (text: string | null | undefined): number | null => {
  const clean = sanitizeDecimal(text ?? '');
  if (!/\d/.test(clean)) return null;
  return Number(clean.replace(',', '.'));
};

const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000; // UTC−5, sin horario de verano
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Día en Colombia de un instante, como "AAAA-MM-DD", aunque el teléfono tenga otra zona
 * horaria. Es el mismo formato que usa el backend para agrupar por día.
 */
export const colombiaDateKey = (value: Date | string): string =>
  new Date(new Date(value).getTime() + COLOMBIA_OFFSET_MS).toISOString().slice(0, 10);

/** Suma (o resta) días a un "AAAA-MM-DD". */
export const addDaysToDateKey = (key: string, days: number): string =>
  new Date(Date.parse(key) + days * DAY_MS).toISOString().slice(0, 10);

/** Días entre dos "AAAA-MM-DD" (positivo si `to` es posterior). */
export const daysBetweenDateKeys = (from: string, to: string): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

/** El lunes de la semana de un "AAAA-MM-DD" (la semana va de lunes a domingo, como en el backend). */
export const weekStartDateKey = (key: string): string =>
  addDaysToDateKey(key, -((new Date(key).getUTCDay() + 6) % 7));

/** Mensajes en español para los errores de dominio que devuelve el backend (campo `error`). */
const DOMAIN_ERROR_MESSAGES: Record<string, string> = {
  InvalidCredentialsError: 'Cédula o contraseña incorrectas.',
  IncorrectCurrentPasswordError: 'La contraseña actual no es correcta.',
  CoffeeGrowerAlreadyExistsError: 'Ya existe una cuenta con esta cédula. Ingresa con tu contraseña.',
  HarvestAlreadyActiveError: 'Ya tienes una cosecha abierta. Ciérrala antes de abrir otra.',
  HarvestNotActiveError: 'La cosecha no está activa.',
  HarvestAlreadyClosedError: 'Esta cosecha ya está cerrada.',
  SaleAlreadyRecordedError: 'La venta de esta cosecha ya fue registrada.',
  WorkerNotFoundError: 'No encontramos ese trabajador.',
  PickerNotFoundError: 'No encontramos ese recolector.',
  CrewNotFoundError: 'No encontramos esa cuadrilla.',
  InvalidKilogramsError: 'Los kilos deben ser mayores que cero.',
  InvalidPaymentAmountError: 'El monto del pago no es válido.',
  IdempotencyKeyConflictError: 'Esta pesada ya se había guardado con otros datos.',
  WorkerHasHarvestHistoryError: 'Este trabajador ya participó en cosechas: no se puede borrar porque se perderían sus pesadas y pagos.',
  HarvestHasRecordsError: 'Esta cosecha ya tiene pesadas o pagos: no se puede eliminar. Ciérrala con "Cerrar cosecha".',
  HarvestHasPaymentsError: 'Ya hay pagos en esta cosecha: el precio por kilo no se puede cambiar. Puedes corregir el nombre.',
  PickerHasRecordsError: 'Este recolector ya tiene pesadas o pagos: no se puede eliminar.',
  HarvestHasNoWeighingsError: 'Esta cosecha aún no tiene kilos pesados: registra al menos una pesada antes de cerrarla.',
};

/**
 * Mensaje para el usuario a partir de un error HTTP. Nunca muestra el texto técnico
 * (URL o mensaje en inglés del backend): usa el código de error de dominio, luego
 * `byStatus` y por último `fallback`, que describe la acción que falló.
 */
export const apiErrorMessage = (
  err: unknown,
  fallback = 'Ocurrió un error inesperado. Intenta de nuevo.',
  byStatus: Record<number, string> = {},
): string => {
  const httpError = err as { status?: number; error?: { error?: string; retryAfterMinutes?: number } } | null;
  const status = httpError?.status;
  if (status === 0) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  const code = httpError?.error?.error;
  if (code === 'TooManyLoginAttemptsError') {
    const minutes = httpError?.error?.retryAfterMinutes ?? 15;
    const wait = minutes === 1 ? '1 minuto' : `${minutes} minutos`;
    return `Hiciste muchos intentos con esta cédula. Por seguridad, espera ${wait} e intenta de nuevo.`;
  }
  if (code && DOMAIN_ERROR_MESSAGES[code]) return DOMAIN_ERROR_MESSAGES[code];
  if (status !== undefined && byStatus[status]) return byStatus[status];
  return fallback;
};

/** Iniciales de las dos primeras palabras ("Juan Pérez" → "JP"), para los chips de personas y cuadrillas. */
export const initialsOf = (...parts: (string | null | undefined)[]): string =>
  parts
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

/**
 * Vibración corta de confirmación para acciones de alto valor y poco frecuentes (guardar
 * una pesada, cerrar la cosecha). En web no hay motor háptico: se ignora sin error.
 */
export const hapticSuccess = (): void => {
  void import('@capacitor/haptics')
    .then(({ Haptics, NotificationType }) => Haptics.notification({ type: NotificationType.Success }))
    .catch(() => undefined);
};
