import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError, switchMap, catchError } from 'rxjs';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

/**
 * Interceptor HTTP que inyecta el JWT en el header Authorization
 * para todas las peticiones autenticadas.
 *
 * Lee el token del SecureStorage (cifrado con Android Keystore en Android).
 * No decodifica el token ni verifica expiración: el backend responde 401 si expiró.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly TOKEN_KEY = 'jwt';
  private readonly PUBLIC_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
  ];

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // No agregar token a endpoints públicos
    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    return from(this.getToken()).pipe(
      switchMap((token) => {
        if (!token) {
          // Sin token: dejar pasar la petición (el backend responderá 401)
          return next.handle(req);
        }

        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next.handle(authReq);
      }),
      catchError((error: HttpErrorResponse) => {
        // 401: token inválido/expirado → limpiar storage y dejar que el facade maneje navegación
        if (error.status === 401) {
          this.clearToken();
        }
        return throwError(() => error);
      })
    );
  }

  private async getToken(): Promise<string | null> {
    try {
      const result = await SecureStorage.get(this.TOKEN_KEY);
      return typeof result === 'string' ? result : null;
    } catch {
      return null;
    }
  }

  private async clearToken(): Promise<void> {
    try {
      await SecureStorage.remove(this.TOKEN_KEY);
    } catch {
      // ignorar errores de limpieza
    }
  }

  private isPublicEndpoint(url: string): boolean {
    return this.PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
  }
}