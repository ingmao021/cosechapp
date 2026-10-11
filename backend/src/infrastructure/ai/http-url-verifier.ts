import { UrlVerifier } from '@domain/price-and-news/coffee-intel.port';

const TIMEOUT_MS = 8000;
/** Algunos medios bloquean robots (401/403/429): el enlace existe aunque no nos dejen leerlo. */
const NOT_FOUND = new Set([404, 410]);

/** Comprueba que una url exista de verdad, para descartar enlaces inventados por la IA. */
export class HttpUrlVerifier implements UrlVerifier {
  async exists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; CosechApp/1.0)' },
      });
      await response.body?.cancel();
      return !NOT_FOUND.has(response.status) && response.status < 500;
    } catch {
      return false;
    }
  }
}
