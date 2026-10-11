import { BusinessRuleViolationError } from '@shared/errors/domain-errors';

export enum NewsKind {
  /** Noticia reciente del café (FNC, Cenicafé, mercado). */
  NEWS = 'NEWS',
  /** Tip agronómico del mes. */
  TIP = 'TIP',
}

/** Noticia o tip obtenido con IA a partir de una fuente real (url verificada). */
export class NewsArticle {
  private constructor(
    public readonly id: string,
    public readonly kind: NewsKind,
    public readonly title: string,
    public readonly source: string,
    public readonly summary: string,
    public readonly url: string,
    public readonly publishedAt: Date,
    /** Mes ("AAAA-MM") al que pertenece un tip; null en las noticias. */
    public readonly month: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(input: {
    id: string;
    kind: NewsKind;
    title: string;
    source: string;
    summary: string;
    url: string;
    publishedAt: Date;
    month?: string | null;
  }): NewsArticle {
    const title = input.title.trim();
    const summary = input.summary.trim();
    if (!title || !summary) {
      throw new BusinessRuleViolationError('News article needs a title and a summary');
    }
    if (!/^https?:\/\//i.test(input.url)) {
      throw new BusinessRuleViolationError('News article url must be http(s)');
    }
    if (Number.isNaN(input.publishedAt.getTime())) {
      throw new BusinessRuleViolationError('News article needs a valid publication date');
    }
    return new NewsArticle(
      input.id,
      input.kind,
      title,
      input.source.trim(),
      summary,
      input.url,
      input.publishedAt,
      input.month ?? null,
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    kind: NewsKind,
    title: string,
    source: string,
    summary: string,
    url: string,
    publishedAt: Date,
    month: string | null,
    createdAt: Date,
  ): NewsArticle {
    return new NewsArticle(id, kind, title, source, summary, url, publishedAt, month, createdAt);
  }
}
