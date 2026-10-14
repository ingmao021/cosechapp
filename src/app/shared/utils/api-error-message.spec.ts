import { apiErrorMessage } from './index';

describe('apiErrorMessage', () => {
  it('explains there is no connection when the request never reached the server', () => {
    expect(apiErrorMessage({ status: 0 }, 'x')).toContain('No hay conexión');
  });

  it('translates known domain error codes from the backend', () => {
    const err = { status: 409, error: { error: 'HarvestAlreadyActiveError', message: 'There is already an active harvest' } };
    expect(apiErrorMessage(err, 'fallback')).toBe('Ya tienes una cosecha abierta. Ciérrala antes de abrir otra.');
  });

  it('never shows the English backend message: uses the fallback', () => {
    const err = { status: 422, error: { error: 'BusinessRuleViolationError', message: 'Nothing to pay for this picker' } };
    expect(apiErrorMessage(err, 'No se pudo registrar el pago.')).toBe('No se pudo registrar el pago.');
  });

  it('uses a per-status message when given', () => {
    expect(apiErrorMessage({ status: 401 }, 'fallback', { 401: 'Cédula o contraseña incorrectas.' })).toBe(
      'Cédula o contraseña incorrectas.',
    );
  });

  it('tells how long to wait after too many failed logins', () => {
    const err = { status: 429, error: { error: 'TooManyLoginAttemptsError', retryAfterMinutes: 12 } };
    expect(apiErrorMessage(err, 'fallback')).toBe(
      'Hiciste muchos intentos con esta cédula. Por seguridad, espera 12 minutos e intenta de nuevo.',
    );
  });
});
