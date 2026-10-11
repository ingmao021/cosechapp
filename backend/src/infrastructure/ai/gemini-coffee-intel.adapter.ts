import { Logger } from '@nestjs/common';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import {
  CoffeeIntelPort,
  FncPriceReport,
  NewsReport,
  PricePoint,
  TipReport,
} from '@domain/price-and-news/coffee-intel.port';

const REQUEST_TIMEOUT_MS = 90_000;

/**
 * CoffeeIntelPort con Gemini. Precio, noticias y tips usan búsqueda en Google (grounding)
 * para basarse en fuentes reales; el análisis del precio solo usa el historial de la BD.
 *
 * No todos los modelos aceptan esquema JSON junto con herramientas, así que el JSON se pide
 * en el prompt y se extrae del texto; el caso de uso valida todo antes de guardarlo.
 */
export class GeminiCoffeeIntelAdapter implements CoffeeIntelPort {
  readonly enabled = true;
  private readonly logger = new Logger(GeminiCoffeeIntelAdapter.name);
  private readonly ai: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } });
  }

  async fetchFncPrice(): Promise<FncPriceReport | null> {
    const response = await this.searchAndAnswer(`
Busca el precio interno de referencia del café publicado HOY (o el último día hábil) por la
Federación Nacional de Cafeteros de Colombia (FNC), en federaciondecafeteros.org.
Es el precio en pesos colombianos (COP) por carga de 125 kg de café pergamino seco.
Responde SOLO con este JSON, sin texto adicional:
{"found": true, "value": 2850000, "date": "AAAA-MM-DD"}
- "value": número entero en COP, sin puntos ni símbolos.
- "date": fecha en que la FNC publicó ese precio.
Si no encuentras el precio publicado por la FNC, responde {"found": false}.`);

    const data = parseJson<{ found?: boolean; value?: unknown; date?: unknown }>(response.text);
    if (!data?.found || typeof data.value !== 'number' || typeof data.date !== 'string') return null;
    return { value: data.value, date: data.date, sources: groundingSources(response) };
  }

  async fetchNews(): Promise<NewsReport[]> {
    const response = await this.searchAndAnswer(`
Busca las noticias más recientes (últimos 15 días) sobre el café en Colombia que le sirvan a un
caficultor: precio y mercado, anuncios de la Federación Nacional de Cafeteros (FNC), Cenicafé,
clima, plagas y apoyos del gobierno. Usa solo medios y fuentes reales que encuentres.
Responde SOLO con un JSON array (máximo 8), sin texto adicional:
[{"title": "...", "source": "nombre del medio", "summary": "2 frases en español sencillo",
  "url": "enlace exacto a la noticia", "publishedAt": "AAAA-MM-DD"}]`);

    const items = parseJson<unknown[]>(response.text);
    if (!Array.isArray(items)) return [];
    const resolved = await resolveGroundingUrls(response);
    return items
      .filter(isRecord)
      .map((item) => ({
        title: str(item['title']),
        source: str(item['source']),
        summary: str(item['summary']),
        url: preferGroundedUrl(str(item['url']), resolved),
        publishedAt: str(item['publishedAt']),
      }))
      .filter((item) => item.title && item.url);
  }

  async analyzePrice(history: PricePoint[]): Promise<string> {
    const lines = history
      .map((point) => `${point.date.toISOString().slice(0, 10)}: $${Math.round(point.value).toLocaleString('es-CO')}`)
      .join('\n');
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `
Eres un asesor para caficultores colombianos. Este es el historial del precio interno de
referencia FNC (COP por carga de 125 kg), del más reciente al más antiguo:
${lines}

Escribe en español sencillo, máximo 3 frases (menos de 60 palabras), cómo está el precio de hoy
frente a los registros anteriores (sube, baja o se mantiene, y cuánto). Si solo hay un registro,
dilo sin inventar tendencia. No recomiendes vender ni guardar el café, no des pronósticos y no
uses markdown.`,
      config: { temperature: 0.3 },
    });
    const text = (response.text ?? '').replace(/[*_#`]/g, '').trim();
    if (!text) throw new Error('Empty price analysis');
    return text;
  }

  async monthlyTips(month: string): Promise<TipReport[]> {
    const response = await this.searchAndAnswer(`
Estamos en el mes ${month} en Colombia. Busca en Cenicafé o la Federación Nacional de Cafeteros
recomendaciones agronómicas para el cultivo de café que apliquen en esta época del año
(cosecha, floración, broca, roya, fertilización, manejo de lluvias o sequía).
Responde SOLO con un JSON array de 3 o 4 tips, sin texto adicional:
[{"title": "máximo 6 palabras", "summary": "1 o 2 frases prácticas en español sencillo",
  "source": "Cenicafé o FNC", "url": "enlace exacto a la fuente"}]`);

    const items = parseJson<unknown[]>(response.text);
    if (!Array.isArray(items)) return [];
    const resolved = await resolveGroundingUrls(response);
    return items
      .filter(isRecord)
      .map((item) => ({
        title: str(item['title']),
        summary: str(item['summary']),
        source: str(item['source']),
        url: preferGroundedUrl(str(item['url']), resolved),
      }))
      .filter((item) => item.title && item.url);
  }

  private async searchAndAnswer(prompt: string): Promise<GenerateContentResponse> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt.trim(),
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 },
    });
    if (!response.text) {
      this.logger.warn(`Empty Gemini answer (finish: ${response.candidates?.[0]?.finishReason ?? 'unknown'})`);
    }
    return response;
  }
}

/** Dominios (title) y urls de las fuentes que Gemini consultó. */
function groundingSources(response: GenerateContentResponse): string[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  return chunks.flatMap((chunk) => [chunk.web?.title, chunk.web?.domain, chunk.web?.uri]).filter((s): s is string => !!s);
}

/**
 * Las urls del grounding son redirecciones de Google; se resuelven a la url real para poder
 * reemplazar enlaces que el modelo haya escrito mal.
 */
async function resolveGroundingUrls(response: GenerateContentResponse): Promise<string[]> {
  const uris = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [])
    .map((chunk) => chunk.web?.uri)
    .filter((uri): uri is string => !!uri);
  const resolved = await Promise.all(
    uris.map(async (uri) => {
      try {
        const res = await fetch(uri, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(5000) });
        return res.headers.get('location') ?? null;
      } catch {
        return null;
      }
    }),
  );
  return resolved.filter((url): url is string => !!url && /^https?:\/\//.test(url));
}

/** Si el enlace del modelo no está entre las fuentes reales, usa la fuente real del mismo sitio. */
function preferGroundedUrl(url: string, grounded: string[]): string {
  if (!url || grounded.includes(url)) return url;
  const host = hostOf(url);
  const sameSite = host ? grounded.filter((g) => hostOf(g) === host) : [];
  return sameSite.length === 1 ? sameSite[0] : url;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Extrae el primer JSON (objeto o array) del texto, tolerando ```json ... ```. */
export function parseJson<T>(text: string | undefined): T | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.search(/[[{]/);
  if (start < 0) return null;
  const open = cleaned[start];
  const end = cleaned.lastIndexOf(open === '[' ? ']' : '}');
  if (end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
