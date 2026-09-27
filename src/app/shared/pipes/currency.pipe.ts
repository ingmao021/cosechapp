import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatear moneda COP (Pesos Colombianos).
 * Uso: {{ amount | currency }} → "$ 1.234.567 COP"
 * Formato: signo $, separador de miles con punto, sin decimales (COP no usa centavos en este contexto),
 * espacio entre signo y número, sufijo " COP".
 */
@Pipe({
  name: 'currency',
  standalone: false,
})
export class CurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, showSymbol = true, showCurrencyCode = true): string {
    if (value === null || value === undefined || isNaN(value)) {
      const zero = showSymbol ? '$ 0' : '0';
      return showCurrencyCode ? `${zero} COP` : zero;
    }

    // COP: sin decimales, redondear a entero
    const rounded = Math.round(value);

    // Formatear con separador de miles (punto)
    const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let result = '';
    if (showSymbol) {
      result = `$ ${formatted}`;
    } else {
      result = formatted;
    }

    if (showCurrencyCode) {
      result = `${result} COP`;
    }

    return result;
  }
}