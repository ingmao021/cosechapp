import { parseDecimal, parseInteger, sanitizeDecimal, sanitizeInteger } from './index';

describe('numbers typed by the user (no dot while typing)', () => {
  it('amounts in pesos keep only digits, so "18.500" is eighteen thousand five hundred', () => {
    expect(sanitizeInteger('18.500')).toBe('18500');
    expect(sanitizeInteger('1.250.000')).toBe('1250000');
    expect(sanitizeInteger('$ 2,000')).toBe('2000');
    expect(sanitizeInteger('007')).toBe('7');
    expect(parseInteger('18.500')).toBe(18500);
    expect(parseInteger('')).toBeNull();
    expect(parseInteger(null)).toBeNull();
  });

  it('kilos use the decimal comma; a typed dot becomes that comma', () => {
    expect(sanitizeDecimal('25.5')).toBe('25,5');
    expect(sanitizeDecimal('25,5')).toBe('25,5');
    expect(sanitizeDecimal(',5')).toBe('0,5');
    expect(sanitizeDecimal('12,')).toBe('12,');
    expect(sanitizeDecimal('1,2,3')).toBe('1,23');
    expect(sanitizeDecimal('3,14159')).toBe('3,141');
    expect(parseDecimal('25,5')).toBe(25.5);
    expect(parseDecimal('12,')).toBe(12);
    expect(parseDecimal('')).toBeNull();
  });
});
