import { TooManyLoginAttemptsError } from '@shared/errors/domain-errors';
import { LOGIN_LOCKOUT_MS, LoginAttemptLimiter } from './login-attempt-limiter';

describe('LoginAttemptLimiter', () => {
  const ID = '1234567890';
  let now: number;
  let limiter: LoginAttemptLimiter;

  const fail = (times: number) => {
    for (let i = 0; i < times; i++) limiter.recordFailure(ID);
  };

  beforeEach(() => {
    now = 1_000_000;
    limiter = new LoginAttemptLimiter(() => now);
  });

  it('allows 4 failures and locks on the 5th', () => {
    fail(4);
    expect(() => limiter.assertAllowed(ID)).not.toThrow();
    expect(() => limiter.recordFailure(ID)).toThrow(TooManyLoginAttemptsError);
    expect(() => limiter.assertAllowed(ID)).toThrow(TooManyLoginAttemptsError);
  });

  it('reports the minutes left and unlocks after 15 minutes', () => {
    fail(4);
    expect(() => limiter.recordFailure(ID)).toThrow();

    now += 10 * 60 * 1000 + 1;
    try {
      limiter.assertAllowed(ID);
      throw new Error('expected a lock');
    } catch (error) {
      expect((error as TooManyLoginAttemptsError).retryAfterMinutes).toBe(5);
    }

    now += 5 * 60 * 1000;
    expect(() => limiter.assertAllowed(ID)).not.toThrow();
    // Tras el bloqueo la cuenta empieza de cero.
    fail(4);
    expect(() => limiter.assertAllowed(ID)).not.toThrow();
  });

  it('a successful login resets the count', () => {
    fail(4);
    limiter.recordSuccess(ID);
    fail(4);
    expect(() => limiter.assertAllowed(ID)).not.toThrow();
  });

  it('forgets failures older than the lockout window', () => {
    fail(4);
    now += LOGIN_LOCKOUT_MS;
    expect(() => limiter.recordFailure(ID)).not.toThrow();
  });

  it('keeps national IDs apart', () => {
    fail(4);
    expect(() => limiter.recordFailure('otra-cedula')).not.toThrow();
    expect(() => limiter.assertAllowed('otra-cedula')).not.toThrow();
  });
});
