import { NewsArticle } from './news-article.entity';

export interface NewsArticleRepository {
  save(article: NewsArticle): Promise<NewsArticle>;
  /** Noticias (kind NEWS) publicadas desde `since`, de la más nueva a la más vieja. */
  findRecentNews(since: Date, limit: number): Promise<NewsArticle[]>;
  /** Urls ya guardadas entre las dadas (para no repetir noticias). */
  findExistingUrls(urls: string[]): Promise<string[]>;
  /** Cuándo se guardó la última noticia (o null si no hay). */
  findLatestNewsCreatedAt(): Promise<Date | null>;
}
