import { GoogleGenAI } from '@google/genai';
import { CoffeeIntelPort, PricePoint } from '@domain/price-and-news/coffee-intel.port';

const REQUEST_TIMEOUT_MS = 60_000;

/**
 * CoffeeIntelPort con Gemini en el plan gratuito: nunca usa la búsqueda en Google (que exige
 * facturación), solo trabaja sobre datos reales que ya tenemos (historial de precios, titulares).
 * Sin facturación activa, pasarse del límite responde 429 y no genera cobros.
 */
export class GeminiCoffeeIntelAdapter implements CoffeeIntelPort {
  readonly enabled = true;
  private readonly ai: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: REQUEST_TIMEOUT_MS,
        // Picos de demanda (503) son pasajeros; un 429 de cuota no se arregla reintentando.
        retryOptions: { attempts: 3, initialDelay: 2, maxDelay: 20, httpStatusCodes: [500, 502, 503, 504] },
      },
    });
  }

  async analyzePrice(history: PricePoint[]): Promise<string> {
    const lines = history
      .map((point) => `${colombianDate(point.date)}: $${Math.round(point.value).toLocaleString('es-CO')}`)
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

  async pickRelevantNews(titles: string[], max: number): Promise<number[]> {
    const list = titles.map((title, index) => `${index}. ${title}`).join('\n');
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `
Estos son titulares recientes de noticias. Elige hasta ${max} que más le sirvan a un caficultor
colombiano (precio y mercado del café, Federación Nacional de Cafeteros, Cenicafé, clima,
plagas, apoyos o normas para caficultores). Descarta las que no traten del café en Colombia,
las repetidas y las de farándula o recetas. Ordénalas de más a menos útil.

${list}

Responde solo con los números de los titulares elegidos.`,
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: { indexes: { type: 'array', items: { type: 'integer' } } },
          required: ['indexes'],
        },
      },
    });
    const parsed = JSON.parse(response.text ?? '{}') as { indexes?: unknown };
    if (!Array.isArray(parsed.indexes)) throw new Error('Invalid news selection');
    return parsed.indexes.filter((i): i is number => typeof i === 'number');
  }
}

/** Fecha en hora de Colombia ("30 sept 2026"), para que el modelo no tenga que convertir zonas. */
function colombianDate(date: Date): string {
  return date.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', year: 'numeric' });
}
