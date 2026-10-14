import { TooManyLoginAttemptsError } from '@shared/errors/domain-errors';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

/** Por encima de este tamaño se descartan las entradas vencidas (cédulas al azar de un atacante). */
const PRUNE_THRESHOLD = 10_000;

interface FailureEntry {
  count: number;
  lastFailureAt: number;
  lockedUntil: number | null;
}

/**
 * Intentos fallidos de ingreso por cédula: al quinto seguido la cédula queda bloqueada
 * 15 minutos. Los fallos más viejos que ese lapso dejan de contar y un ingreso correcto
 * reinicia la cuenta. Vive en memoria: el backend corre en una sola instancia y un
 * reinicio solo devuelve los intentos.
 */
export class LoginAttemptLimiter {
  private readonly failures = new Map<string, FailureEntry>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxAttempts = MAX_FAILED_LOGIN_ATTEMPTS,
    private readonly lockoutMs = LOGIN_LOCKOUT_MS,
  ) {}

  /** Lanza TooManyLoginAttemptsError si la cédula está bloqueada. */
  assertAllowed(nationalId: string): void {
    const entry = this.failures.get(nationalId);
    if (!entry?.lockedUntil) return;
    const remainingMs = entry.lockedUntil - this.now();
    if (remainingMs > 0) {
      throw new TooManyLoginAttemptsError(Math.ceil(remainingMs / 60_000));
    }
    this.failures.delete(nationalId);
  }

  /** Registra un fallo; el que completa el límite bloquea la cédula y lanza el error. */
  recordFailure(nationalId: string): void {
    const now = this.now();
    if (this.failures.size >= PRUNE_THRESHOLD) this.pruneExpired(now);

    const previous = this.failures.get(nationalId);
    const stillCounts = previous && now - previous.lastFailureAt < this.lockoutMs;
    const count = (stillCounts ? previous.count : 0) + 1;
    const lockedUntil = count >= this.maxAttempts ? now + this.lockoutMs : null;
    this.failures.set(nationalId, { count, lastFailureAt: now, lockedUntil });

    if (lockedUntil) {
      throw new TooManyLoginAttemptsError(Math.ceil(this.lockoutMs / 60_000));
    }
  }

  recordSuccess(nationalId: string): void {
    this.failures.delete(nationalId);
  }

  private pruneExpired(now: number): void {
    for (const [nationalId, entry] of this.failures) {
      const expiresAt = entry.lockedUntil ?? entry.lastFailureAt + this.lockoutMs;
      if (expiresAt <= now) this.failures.delete(nationalId);
    }
  }
}
