import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// DTOs matching backend PriceAndNewsController
export interface CoffeePriceResponse {
  id: string;
  value: number;
  queryDate: string;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  coffeeGrowerId: string;
  type: string;
  date: string;
  read: boolean;
  /** Precio FNC publicado que generó la notificación. */
  priceValue: number | null;
  createdAt: string;
}

/** Noticia del café (Google Noticias), con el enlace a la nota original. */
export interface NewsItem {
  id: string;
  kind: 'NEWS';
  title: string;
  /** Medio que la publicó (ej. "Caracol Radio"). */
  source: string;
  /** Vacío cuando la fuente no trae resumen (no se inventa uno). */
  summary: string;
  url: string;
  publishedAt: string;
}

/** Análisis corto del precio FNC vigente, generado con IA. */
export interface PriceAnalysis {
  text: string;
  generatedAt: string;
  basedOnPriceId: string;
}

/**
 * Servicio HTTP para precio FNC y noticias.
 * Wrapper tipado sobre los endpoints del PriceAndNewsController del backend.
 */
@Injectable({ providedIn: 'root' })
export class PriceAndNewsService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/price-and-news`;

  /**
   * Obtiene el último precio del café FNC.
   */
  getLatestCoffeePrice(): Observable<CoffeePriceResponse | null> {
    return this.http.get<CoffeePriceResponse | null>(`${this.baseUrl}/coffee-price`);
  }

  /**
   * Obtiene el historial de precios del café.
   */
  getCoffeePriceHistory(): Observable<CoffeePriceResponse[]> {
    return this.http.get<CoffeePriceResponse[]>(`${this.baseUrl}/coffee-price/history`);
  }

  /**
   * Obtiene notificaciones del usuario actual.
   */
  getNotifications(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}/notifications`);
  }

  /**
   * Obtiene notificaciones no leídas.
   */
  getUnreadNotifications(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}/notifications/unread`);
  }

  /**
   * Marca una notificación como leída.
   */
  markAsRead(notificationId: string): Observable<NotificationResponse | null> {
    return this.http.patch<NotificationResponse | null>(`${this.baseUrl}/notifications/${notificationId}/read`, {});
  }

  /**
   * Obtiene las noticias recientes del café.
   */
  getNews(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>(`${this.baseUrl}/news`);
  }

  /**
   * Obtiene el análisis con IA del precio vigente (null si aún no hay).
   */
  getPriceAnalysis(): Observable<PriceAnalysis | null> {
    return this.http.get<PriceAnalysis | null>(`${this.baseUrl}/coffee-price/analysis`);
  }
}