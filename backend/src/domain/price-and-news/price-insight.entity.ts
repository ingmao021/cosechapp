import { BusinessRuleViolationError } from '@shared/errors/domain-errors';

/** Análisis corto, generado con IA, del precio FNC vigente y su tendencia. */
export class PriceInsight {
  private constructor(
    public readonly id: string,
    public readonly text: string,
    /** Precio FNC sobre el que se hizo el análisis. */
    public readonly coffeePriceId: string,
    public readonly createdAt: Date,
  ) {}

  static create(id: string, text: string, coffeePriceId: string): PriceInsight {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new BusinessRuleViolationError('Price insight text cannot be empty');
    }
    return new PriceInsight(id, trimmed, coffeePriceId, new Date());
  }

  static reconstitute(id: string, text: string, coffeePriceId: string, createdAt: Date): PriceInsight {
    return new PriceInsight(id, text, coffeePriceId, createdAt);
  }
}
