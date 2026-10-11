import { NewsFeedSource, NewsReport } from '@domain/price-and-news/coffee-intel.port';

/** Noticias de café en Colombia de las últimas dos semanas, en español de Colombia. */
export const GOOGLE_NEWS_FEED_URL =
  'https://news.google.com/rss/search?q=caf%C3%A9+Colombia+caficultores+when:14d&hl=es-419&gl=CO&ceid=CO:es-419';
const TIMEOUT_MS = 20_000;

/** RSS de Google Noticias: gratis y con el enlace real de cada nota. */
export class GoogleNewsFeedSource implements NewsFeedSource {
  constructor(private readonly url: string = GOOGLE_NEWS_FEED_URL) {}

  async fetchRecent(): Promise<NewsReport[]> {
    const response = await fetch(this.url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; CosechApp/1.0)' },
    });
    if (!response.ok) throw new Error(`Google News responded ${response.status}`);
    return parseNewsFeed(await response.text()).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
}

export function parseNewsFeed(xml: string): NewsReport[] {
  const items = xml.split('<item>').slice(1);
  return items.flatMap((item) => {
    const rawTitle = tag(item, 'title');
    const url = tag(item, 'link');
    const source = tag(item, 'source');
    const publishedAt = new Date(tag(item, 'pubDate'));
    if (!rawTitle || !/^https?:\/\//.test(url) || Number.isNaN(publishedAt.getTime())) return [];
    // Google agrega el medio al final del título: "Titular - Caracol Radio".
    const suffix = source ? ` - ${source}` : '';
    const title = suffix && rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle;
    return [{ title: title.trim(), source, url, publishedAt }];
  });
}

function tag(item: string, name: string): string {
  const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(item);
  if (!match) return '';
  return decodeEntities(match[1].replace(/^<!\[CDATA\[|\]\]>$/g, '')).trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
