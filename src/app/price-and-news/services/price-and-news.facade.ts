import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PriceAndNewsService, NotificationResponse, NewsItem, PriceAnalysis } from './price-and-news.service';
import { OfflineStore } from '../../sync/services/offline-store';
import { apiErrorMessage } from '../../shared/utils';

interface CoffeePrice {
  value: number;
  queryDate: string;
}

/** Lo último recibido de la pestaña, para consultarlo sin señal en el cafetal. */
interface PriceNewsSnapshot {
  coffeePrice: CoffeePrice | null;
  analysis: PriceAnalysis | null;
  news: NewsItem[];
}

const SNAPSHOT_KEY = 'price-news';
const isOffline = (err: unknown) => err instanceof HttpErrorResponse && err.status === 0;

/**
 * Facade de Precio y Noticias — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - coffeePrice / analysis: precio FNC vigente y su análisis con IA
 * - news: noticias recientes del café (Google Noticias, elegidas con IA)
 * - notifications / unreadCount
 * - isLoading: hay alguna carga en curso
 * - isOfflineData: se está mostrando lo guardado porque no hay señal
 * - error: string | null
 *
 * Métodos de acción:
 * - loadAll() / refresh(): toda la pestaña (también pull-to-refresh)
 * - loadCoffeePrice(), loadNotifications(), markAsRead(notificationId)
 *
 * Delega llamadas HTTP al PriceAndNewsService.
 */
@Injectable({ providedIn: 'root' })
export class PriceAndNewsFacade {
  private readonly priceAndNewsService = inject(PriceAndNewsService);
  private readonly offlineStore = inject(OfflineStore);

  // Estado privado (signals)
  private readonly _coffeePrice = signal<CoffeePrice | null>(null);
  private readonly _analysis = signal<PriceAnalysis | null>(null);
  private readonly _notifications = signal<NotificationResponse[]>([]);
  private readonly _news = signal<NewsItem[]>([]);
  /** Cargas en curso: con un booleano, la primera en terminar apagaba el spinner de las demás. */
  private readonly _pending = signal(0);
  private readonly _isOfflineData = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly coffeePrice = this._coffeePrice.asReadonly();
  readonly analysis = this._analysis.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly news = this._news.asReadonly();
  readonly isOfflineData = this._isOfflineData.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly isLoading = computed(() => this._pending() > 0);

  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.read).length
  );

  readonly hasPrice = computed(() => this._coffeePrice() !== null);

  readonly formattedPrice = computed(() => {
    const price = this._coffeePrice();
    if (!price) return '$ 0 COP';
    return `$ ${price.value.toLocaleString('es-CO')} COP`;
  });

  readonly priceDate = computed(() => {
    const price = this._coffeePrice();
    if (!price) return '';
    const date = new Date(price.queryDate);
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  });

  /**
   * Carga el precio actual del café FNC.
   */
  async loadCoffeePrice(): Promise<void> {
    await this.track(async () => {
      try {
        const price = await firstValueFrom(this.priceAndNewsService.getLatestCoffeePrice());
        this._coffeePrice.set(price ?? null);
      } catch (err) {
        if (!this.restoreOnOffline(err)) {
          this._error.set(apiErrorMessage(err, 'Error al cargar precio del café'));
        }
      }
    });
  }

  /**
   * Carga las notificaciones del usuario.
   */
  async loadNotifications(): Promise<void> {
    await this.track(async () => {
      try {
        const notifications = await firstValueFrom(this.priceAndNewsService.getNotifications());
        this._notifications.set(notifications ?? []);
      } catch (err) {
        if (!isOffline(err)) this._error.set(apiErrorMessage(err, 'Error al cargar notificaciones'));
      }
    });
  }

  /**
   * Carga precio, análisis y noticias; si no hay señal, muestra lo último guardado.
   */
  async loadPriceAndNews(): Promise<void> {
    await this.track(async () => {
      try {
        const [price, analysis, news] = await Promise.all([
          firstValueFrom(this.priceAndNewsService.getLatestCoffeePrice()),
          firstValueFrom(this.priceAndNewsService.getPriceAnalysis()),
          firstValueFrom(this.priceAndNewsService.getNews()),
        ]);
        this._coffeePrice.set(price ?? null);
        this._analysis.set(analysis ?? null);
        this._news.set(news ?? []);
        this._isOfflineData.set(false);
        this.offlineStore.saveSnapshot<PriceNewsSnapshot>(SNAPSHOT_KEY, {
          coffeePrice: this._coffeePrice(),
          analysis: this._analysis(),
          news: this._news(),
        });
      } catch (err) {
        if (!this.restoreOnOffline(err)) {
          this._error.set(apiErrorMessage(err, 'No se pudieron cargar el precio y las noticias'));
        }
      }
    });
  }

  /**
   * Marca una notificación como leída.
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await firstValueFrom(this.priceAndNewsService.markAsRead(notificationId));
      this._notifications.update(current =>
        current.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      this._error.set(apiErrorMessage(err, 'Error al marcar notificación'));
    }
  }

  /**
   * Carga toda la pestaña: precio, análisis, noticias y notificaciones.
   */
  async loadAll(): Promise<void> {
    this._error.set(null);
    await Promise.all([this.loadPriceAndNews(), this.loadNotifications()]);
  }

  /**
   * Pull-to-refresh: recarga toda la pestaña.
   */
  async refresh(): Promise<void> {
    await this.loadAll();
  }

  /**
   * Limpia el error actual.
   */
  clearError(): void {
    this._error.set(null);
  }

  private async track(load: () => Promise<void>): Promise<void> {
    this._pending.update(n => n + 1);
    try {
      await load();
    } finally {
      this._pending.update(n => n - 1);
    }
  }

  /** Sin señal: restaura lo último guardado. False si no es falta de señal o no hay nada guardado. */
  private restoreOnOffline(err: unknown): boolean {
    if (!isOffline(err)) return false;
    const snapshot = this.offlineStore.readSnapshot<PriceNewsSnapshot>(SNAPSHOT_KEY);
    if (!snapshot) return false;
    this._coffeePrice.set(snapshot.value.coffeePrice);
    this._analysis.set(snapshot.value.analysis);
    this._news.set(snapshot.value.news);
    this._isOfflineData.set(true);
    return true;
  }
}
