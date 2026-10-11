import { PriceInsight } from './price-insight.entity';

export interface PriceInsightRepository {
  save(insight: PriceInsight): Promise<PriceInsight>;
  findLatest(): Promise<PriceInsight | null>;
}
