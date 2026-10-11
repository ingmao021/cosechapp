/**
 * Puertos hacia las fuentes gratuitas de Precio y Noticias: la web de la FNC, el RSS de
 * Google Noticias y Gemini (plan gratuito, sin búsqueda en Google).
 * Lo que devuelven es crudo: el caso de uso RefreshCoffeeIntel lo valida antes de guardarlo.
 */

/** Precio interno de referencia publicado en la web de la FNC. */
export interface FncPriceReport {
  /** Pesos colombianos por carga de 125 kg de café pergamino seco. */
  value: number;
  /** Fecha de publicación del precio (AAAA-MM-DD). */
  date: string;
}

export interface FncPriceSource {
  fetchLatest(): Promise<FncPriceReport | null>;
}

/** Noticia tal como viene del feed: título, medio, enlace real y fecha. */
export interface NewsReport {
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
}

export interface NewsFeedSource {
  /** Noticias recientes del café en Colombia, de la más nueva a la más vieja. */
  fetchRecent(): Promise<NewsReport[]>;
}

export interface PricePoint {
  value: number;
  date: Date;
}

/** IA en el plan gratuito: solo trabaja sobre datos que ya tenemos, sin buscar en la web. */
export interface CoffeeIntelPort {
  /** False si no hay IA configurada (sin GEMINI_API_KEY). */
  readonly enabled: boolean;
  /** Texto corto sobre la tendencia, a partir del historial (del más nuevo al más viejo). */
  analyzePrice(history: PricePoint[]): Promise<string>;
  /** Índices de los titulares más útiles para un caficultor, en orden de importancia. */
  pickRelevantNews(titles: string[], max: number): Promise<number[]>;
}
