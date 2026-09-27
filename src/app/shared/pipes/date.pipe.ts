import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatear fechas en español Colombia.
 * Formatos soportados:
 * - 'short': "26 sep 2026, 14:30" (default)
 * - 'date': "26 sep 2026"
 * - 'time': "14:30"
 * - 'full': "26 de septiembre de 2026, 14:30:00"
 * - 'iso': "2026-09-26T14:30:00"
 * - 'relative': "hace 2 horas" / "hace 3 días" (aproximado)
 *
 * Uso: {{ date | dateFormat:'short' }} o {{ date | dateFormat }}
 */
@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  private readonly monthsShort = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  private readonly monthsLong = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  transform(value: string | Date | number | null | undefined, format: 'short' | 'date' | 'time' | 'full' | 'iso' | 'relative' = 'short'): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    switch (format) {
      case 'short':
        return this.formatShort(date);
      case 'date':
        return this.formatDateOnly(date);
      case 'time':
        return this.formatTimeOnly(date);
      case 'full':
        return this.formatFull(date);
      case 'iso':
        return date.toISOString();
      case 'relative':
        return this.formatRelative(date);
      default:
        return this.formatShort(date);
    }
  }

  private formatShort(date: Date): string {
    const day = date.getDate();
    const month = this.monthsShort[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }

  private formatDateOnly(date: Date): string {
    const day = date.getDate();
    const month = this.monthsShort[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  private formatTimeOnly(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private formatFull(date: Date): string {
    const day = date.getDate();
    const month = this.monthsLong[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day} de ${month} de ${year}, ${hours}:${minutes}:${seconds}`;
  }

  private formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return this.formatShort(date); // fallback a formato corto si > 1 semana
  }
}