import { Injectable } from '@nestjs/common';
import { NewsArticle, NewsKind } from '@domain/price-and-news/news-article.entity';
import { NewsArticleRepository } from '@domain/price-and-news/news-article.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaNewsArticleRepository implements NewsArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.getClient();
  }

  async save(article: NewsArticle): Promise<NewsArticle> {
    const saved = await this.client.newsArticle.upsert({
      where: { id: article.id },
      create: this.toPersistence(article),
      update: this.toPersistence(article),
    });
    return this.toDomain(saved);
  }

  async findRecentNews(since: Date, limit: number): Promise<NewsArticle[]> {
    const found = await this.client.newsArticle.findMany({
      where: { kind: NewsKind.NEWS, publishedAt: { gte: since } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return found.map(this.toDomain);
  }

  async findExistingUrls(urls: string[]): Promise<string[]> {
    if (urls.length === 0) return [];
    const found = await this.client.newsArticle.findMany({
      where: { kind: NewsKind.NEWS, url: { in: urls } },
      select: { url: true },
    });
    return found.map((row) => row.url);
  }

  async findLatestNewsCreatedAt(): Promise<Date | null> {
    const found = await this.client.newsArticle.findFirst({
      where: { kind: NewsKind.NEWS },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return found?.createdAt ?? null;
  }

  private toDomain(prisma: any): NewsArticle {
    return NewsArticle.reconstitute(
      prisma.id,
      prisma.kind as NewsKind,
      prisma.title,
      prisma.source,
      prisma.summary,
      prisma.url,
      prisma.publishedAt,
      prisma.month,
      prisma.createdAt,
    );
  }

  private toPersistence(domain: NewsArticle) {
    return {
      id: domain.id,
      kind: domain.kind,
      title: domain.title,
      source: domain.source,
      summary: domain.summary,
      url: domain.url,
      publishedAt: domain.publishedAt,
      month: domain.month,
      createdAt: domain.createdAt,
    };
  }
}
