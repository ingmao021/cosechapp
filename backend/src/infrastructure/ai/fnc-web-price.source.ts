import { FncPriceReport, FncPriceSource } from '@domain/price-and-news/coffee-intel.port';

export const DEFAULT_FNC_PRICE_URL = 'https://federaciondecafeteros.org/wp/';
const TIMEOUT_MS = 20_000;

/**
 * Lee el precio interno de referencia que la FNC publica en su página (gratis, sin IA).
 * Si la página cambia de diseño devuelve null, y el refresh lo reporta como "not-found" en el log.
 */
export class FncWebPriceSource implements FncPriceSource {
  constructor(private readonly url: string = DEFAULT_FNC_PRICE_URL) {}

  async fetchLatest(): Promise<FncPriceReport | null> {
    const response = await fetch(this.url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; CosechApp/1.0)' },
    });
    if (!response.ok) throw new Error(`FNC page responded ${response.status}`);
    return parseFncPrice(await response.text());
  }
}

/**
 * La página muestra, como texto:
 *   "Precio interno de referencia: $2.055.000"
 *   "Fecha: 2026-10-09 Precio interno de referencia para la compra de café pergamino seco por carga de 125 Kg."
 */
export function parseFncPrice(html: string): FncPriceReport | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  const price = /Precio interno de referencia:\s*\$\s*([\d.]+)/i.exec(text);
  const date = /Fecha:\s*(\d{4}-\d{2}-\d{2})\s*Precio interno de referencia/i.exec(text);
  if (!price || !date) return null;

  const value = Number(price[1].replace(/\./g, ''));
  return Number.isFinite(value) ? { value, date: date[1] } : null;
}
