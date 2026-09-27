import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatear kilos con separador de miles y hasta 3 decimales.
 * Uso: {{ kilos | kilos }} → "1.234 kg" o "1.234.567 kg" o "12,5 kg"
 * Formato colombiano: punto como separador de miles, coma decimal.
 */
@Pipe({
  name: 'kilos',
  standalone: true,
})
export class KilosPipe implements PipeTransform {
  transform(value: number | null | undefined, showUnit = true): string {
    if (value === null || value === undefined || isNaN(value)) {
      return showUnit ? '0 kg' : '0';
    }

    // Redondear a 3 decimales máx para evitar ruido de float
    const rounded = Math.round(value * 1000) / 1000;

    // Separar parte entera y decimal
    const parts = rounded.toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1] ? `,${parts[1]}` : '';

    const formatted = `${integerPart}${decimalPart}`;
    return showUnit ? `${formatted} kg` : formatted;
  }
}