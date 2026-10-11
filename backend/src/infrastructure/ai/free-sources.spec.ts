import { parseFncPrice } from './fnc-web-price.source';
import { parseNewsFeed } from './google-news-feed.source';

/** Fragmento real de federaciondecafeteros.org/wp/ (11 oct 2026). */
const FNC_HTML = `
<div class="fnc-ticker-item">
<span class="fnc-ticker-name">Precio interno de referencia:</span>
<span class="fnc-ticker-value">$2.055.000</span>
<span class="fnc-ticker-icon">
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
</span><div class="fnc-tooltip-data" style="display:none;"><div class="t-fecha">Fecha: 2026-10-09</div><div class="t-detalle">Precio interno de referencia para la compra de café pergamino seco por carga de 125 Kg. Este precio varía según distancia del punto de compra al precio.</div></div></div>
<div class="fnc-ticker-item"><span class="fnc-ticker-name">Bolsa The Ice:</span><span class="fnc-ticker-value">315,40</span>
<div class="t-fecha">Fecha: 2026-10-09</div><div class="t-detalle">Bolsa The Ice: Este valor está representado en centavos de dólar por libra.</div></div>`;

/** Item real del RSS de Google Noticias (enlace acortado). */
const RSS = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Google Noticias</title>
<item><title>El café colombiano llega a su día con menos producción, presión cambiaria y una amenaza que crece en el territorio - Portafolio.co</title><link>https://news.google.com/rss/articles/CBMi8gFBVV95?oc=5</link><guid isPermaLink="false">CBMi8gFBVV95</guid><pubDate>Thu, 01 Oct 2026 07:00:00 GMT</pubDate><description>&lt;a href="https://news.google.com/rss/articles/CBMi8gFBVV95?oc=5"&gt;El café&lt;/a&gt;</description><source url="https://www.portafolio.co">Portafolio.co</source></item>
<item><title>Cenicafé &amp; FNC: &quot;la roya&quot; bajo control - Caracol Radio</title><link>https://news.google.com/rss/articles/XYZ?oc=5</link><pubDate>Fri, 02 Oct 2026 10:00:00 GMT</pubDate><source url="https://caracol.com.co">Caracol Radio</source></item>
<item><title>Sin enlace</title><pubDate>Fri, 02 Oct 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`;

describe('free price and news sources', () => {
  describe('parseFncPrice', () => {
    it('reads the internal reference price and its date', () => {
      expect(parseFncPrice(FNC_HTML)).toEqual({ value: 2_055_000, date: '2026-10-09' });
    });

    it('returns null when the page no longer shows the price', () => {
      expect(parseFncPrice('<html><body>Mantenimiento</body></html>')).toBeNull();
    });
  });

  describe('parseNewsFeed', () => {
    it('reads title without the outlet, outlet, link and date', () => {
      const news = parseNewsFeed(RSS);

      expect(news).toHaveLength(2);
      expect(news[0]).toEqual({
        title: 'El café colombiano llega a su día con menos producción, presión cambiaria y una amenaza que crece en el territorio',
        source: 'Portafolio.co',
        url: 'https://news.google.com/rss/articles/CBMi8gFBVV95?oc=5',
        publishedAt: new Date('2026-10-01T07:00:00Z'),
      });
    });

    it('decodes XML entities', () => {
      expect(parseNewsFeed(RSS)[1].title).toBe('Cenicafé & FNC: "la roya" bajo control');
    });
  });
});
