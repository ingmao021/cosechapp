import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatear moneda COP (Pesos Colombianos).
 * Uso: {{ amount | currency }} → "$ 1.234.567 COP"
 * Formato: signo $, separador de miles con punto, sin decimales (COP no usa centavos en este contexto),
 * espacio entre signo y número, sufijo " COP".
 */
@Pipe({
  name: 'currency',
  standalone: true,
})
export class CurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, showSymbol = true, showCurrencyCode = true): string {
    if (value === null || value === undefined || isNaN(value)) {
      const zero = showSymbol ? '$ 0' : '0';
      return showCurrencyCode ? `${zero} COP` : zero;
    }

    // COP: sin decimales, redondear a entero
    const rounded = Math.round(value);

    // Formatear con separador de miles (punto). El signo menos va antes del "$"
    // ("−$ 276.000", con el signo tipográfico), no pegado al número ("$ -276.000").
    const formatted = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sign = rounded < 0 ? '−' : '';

    let result = '';
    if (showSymbol) {
      result = `${sign}$ ${formatted}`;
    } else {
      result = `${sign}${formatted}`;
    }

    if (showCurrencyCode) {
      result = `${result} COP`;
    }

    return result;
  }
}