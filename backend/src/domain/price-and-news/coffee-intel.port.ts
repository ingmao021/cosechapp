/**
 * Puertos hacia el proveedor de IA (Gemini con búsqueda en Google) y hacia la web.
 * Lo que devuelven es crudo: el caso de uso RefreshCoffeeIntel lo valida antes de guardarlo.
 */

/** Precio interno de referencia FNC, tal como lo reporta la IA. */
export interface FncPriceReport {
  /** Pesos colombianos por carga de 125 kg de café pergamino seco. */
  value: number;
  /** Fecha de publicación del precio (AAAA-MM-DD). */
  date: string;
  /** Dominios o urls de las fuentes que la IA consultó (grounding). */
  sources: string[];
}

export interface NewsReport {
  title: string;
  source: string;
  summary: string;
  url: string;
  /** Fecha de publicación (AAAA-MM-DD). */
  publishedAt: string;
}

export interface TipReport {
  title: string;
  summary: string;
  source: string;
  url: string;
}

export interface PricePoint {
  value: number;
  date: Date;
}

export interface CoffeeIntelPort {
  /** False si no hay IA configurada (sin GEMINI_API_KEY): no se intenta nada. */
  readonly enabled: boolean;
  fetchFncPrice(): Promise<FncPriceReport | null>;
  fetchNews(): Promise<NewsReport[]>;
  /** Texto corto sobre la tendencia, a partir del historial (del más nuevo al más viejo). */
  analyzePrice(history: PricePoint[]): Promise<string>;
  /** Tips agronómicos para el mes dado ("AAAA-MM"). */
  monthlyTips(month: string): Promise<TipReport[]>;
}

export interface UrlVerifier {
  /** True si la url existe (descarta enlaces inventados). */
  exists(url: string): Promise<boolean>;
}
