import { Injectable, signal, computed } from '@angular/core';
import { PriceAndNewsService, CoffeePriceResponse, NotificationResponse, NewsItem } from './price-and-news.service';

/**
 * Facade de Precio y Noticias — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - coffeePrice: CoffeePriceResponse | null
 * - notifications: NotificationResponse[]
 * - unreadCount: number
 * - news: NewsItem[]
 * - isLoading: boolean
 * - error: string | null
 *
 * Métodos de acción:
 * - loadCoffeePrice()
 * - loadNotifications()
 * - loadNews()
 * - markAsRead(notificationId)
 * - refreshCoffeePrice()
 *
 * Delega llamadas HTTP al PriceAndNewsService.
 */
@Injectable({ providedIn: 'root' })
export class PriceAndNewsFacade {
  // Estado privado (signals)
  private readonly _coffeePrice = signal<{ value: number; queryDate: string } | null>(null);
  private readonly _notifications = signal<{ id: string; date: string; read: boolean }[]>([]);
  private readonly _news = signal<Array<{ title: string; source: string; summary: string; url: string; publishedAt: string }>>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly coffeePrice = this._coffeePrice.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly news = this._news.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
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

  constructor(private readonly priceAndNewsService: PriceAndNewsService) {}

  /**
   * Carga el precio actual del café FNC.
   */
  async loadCoffeePrice(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const price = await this.priceAndNewsService.getLatestCoffeePrice().toPromise();
      this._coffeePrice.set(price ?? null);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar precio del café');
      this._coffeePrice.set(null);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Carga las notificaciones del usuario.
   */
  async loadNotifications(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const notifications = await this.priceAndNewsService.getNotifications().toPromise();
      this._notifications.set(notifications ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar notificaciones');
      this._notifications.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Carga las noticias y tips agronómicos.
   */
  async loadNews(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const news = await this.priceAndNewsService.getNews().toPromise();
      this._news.set(news ?? []);
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al cargar noticias');
      this._news.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Marca una notificación como leída.
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.priceAndNewsService.markAsRead(notificationId).toPromise();
      this._notifications.update(current =>
        current.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err: any) {
      this._error.set(err?.error?.message ?? 'Error al marcar notificación');
    }
  }

  /**
   * Refresca el precio del café (pull-to-refresh).
   */
  async refreshCoffeePrice(): Promise<void> {
    await this.loadCoffeePrice();
  }

  /**
   * Carga todo: precio, notificaciones y noticias.
   */
  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadCoffeePrice(),
      this.loadNotifications(),
      this.loadNews(),
    ]);
  }

  /**
   * Limpia el error actual.
   */
  clearError(): void {
    this._error.set(null);
  }
}