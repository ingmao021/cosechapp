import { BusinessRuleViolationError } from '@shared/errors/domain-errors';

export enum NewsKind {
  /** Noticia reciente del café (FNC, Cenicafé, mercado). */
  NEWS = 'NEWS',
}

/** Noticia de una fuente real, con su enlace original. */
export class NewsArticle {
  private constructor(
    public readonly id: string,
    public readonly kind: NewsKind,
    public readonly title: string,
    public readonly source: string,
    public readonly summary: string,
    public readonly url: string,
    public readonly publishedAt: Date,
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
  }): NewsArticle {
    const title = input.title.trim();
    // El resumen es opcional: el RSS de noticias no trae texto y no se inventa uno.
    const summary = input.summary.trim();
    if (!title) {
      throw new BusinessRuleViolationError('News article needs a title');
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
    createdAt: Date,
  ): NewsArticle {
    return new NewsArticle(id, kind, title, source, summary, url, publishedAt, createdAt);
  }
}
