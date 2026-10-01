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
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${formatted} COP`;
};

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
  const httpError = err as { status?: number; error?: { error?: string } } | null;
  const status = httpError?.status;
  if (status === 0) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  const code = httpError?.error?.error;
  if (code && DOMAIN_ERROR_MESSAGES[code]) return DOMAIN_ERROR_MESSAGES[code];
  if (status !== undefined && byStatus[status]) return byStatus[status];
  return fallback;
};
