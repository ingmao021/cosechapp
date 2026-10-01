import { Injectable, Injector, signal, computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from '../../shared/utils';
import { OfflineStore } from '../../sync/services/offline-store';
import { HarvestFacade } from '../../harvest/services/harvest.facade';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { AuthService, LoginRequest, RegisterRequest, AuthResponse, ChangePasswordRequest } from './auth.service';

const TOKEN_KEY = 'jwt';

/**
 * Facade de Autenticación — Estado (Signals) + Orquestación.
 *
 * Expone signals de solo lectura hacia los componentes:
 * - isAuthenticated: boolean
 * - currentUser: { id, nationalId, profilePhoto? } | null
 * - isLoading: boolean
 *
 * Métodos de acción:
 * - initSession(): verifica token guardado y llama GET /auth/me
 * - login(nationalId, password)
 * - register(nationalId, password, profilePhoto?)
 * - logout()
 *
 * NO decodifica el JWT ni calcula expiración: delega al backend (GET /auth/me).
 * Si el backend responde 401 → limpia token y navega a login.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly offlineStore = inject(OfflineStore);

  // Estado privado (signals)
  private readonly _isAuthenticated = signal(false);
  private readonly _currentUser = signal<AuthResponse['coffeeGrower'] | null>(null);
  private readonly _isLoading = signal(true); // true durante initSession
  private readonly _error = signal<string | null>(null);

  // Señales públicas de solo lectura
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed para comodidad en templates
  readonly userNationalId = computed(() => this._currentUser()?.nationalId ?? null);
  readonly userProfilePhoto = computed(() => this._currentUser()?.profilePhoto ?? null);

  /**
   * Inicializa la sesión al arrancar la app (llamado desde Splash).
   * Devuelve la ruta de destino; la navegación la hace Splash para poder
   * esperar también a que termine la animación de marca.
   * 1. Sin token → /auth/login
   * 2. Con token → GET /auth/me:
   *    - 200: setea usuario → /home
   *    - 401: el backend invalidó la sesión → limpia token → /auth/login
   *    - Sin conexión u otro error: conserva la sesión (la app funciona offline) → /home
   */
  async initSession(): Promise<string> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const token = await this.getStoredToken();

      if (!token) {
        this._isAuthenticated.set(false);
        this._currentUser.set(null);
        return '/auth/login';
      }

      const me = await firstValueFrom(this.authService.me());
      this._isAuthenticated.set(true);
      this._currentUser.set({
        id: me.id,
        nationalId: me.nationalId,
        profilePhoto: me.profilePhoto,
        createdAt: me.createdAt,
      });
      return '/home';
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        await this.clearStoredToken();
        this._isAuthenticated.set(false);
        this._currentUser.set(null);
        this._error.set('Tu sesión expiró. Ingresa de nuevo.');
        return '/auth/login';
      }
      // Sin conexión: el timeout de sesión lo decide el backend, no el cliente.
      this._isAuthenticated.set(true);
      return '/home';
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Login con cédula y contraseña.
   * Guarda JWT en SecureStorage y actualiza estado.
   */
  async login(nationalId: string, password: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await this.authService.login({ nationalId, password }).toPromise();

      if (response?.accessToken) {
        await this.storeToken(response.accessToken);
        this._isAuthenticated.set(true);
        this._currentUser.set(response.coffeeGrower);
        await this.router.navigate(['/home'], { replaceUrl: true });
      } else {
        throw new Error('Respuesta de login inválida');
      }
    } catch (err: any) {
      this._error.set(apiErrorMessage(err, undefined, { 401: 'Cédula o contraseña incorrectas.' }));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Registro de nuevo caficultor.
   * Guarda JWT en SecureStorage y actualiza estado.
   */
  async register(nationalId: string, password: string, profilePhoto?: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await this.authService.register({ nationalId, password, profilePhoto }).toPromise();

      if (response?.accessToken) {
        await this.storeToken(response.accessToken);
        this._isAuthenticated.set(true);
        this._currentUser.set(response.coffeeGrower);
        await this.router.navigate(['/home'], { replaceUrl: true });
      } else {
        throw new Error('Respuesta de registro inválida');
      }
    } catch (err: any) {
      this._error.set(apiErrorMessage(err, undefined, { 409: 'Ya existe una cuenta con esta cédula. Ingresa con tu contraseña.' }));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Cerrar sesión: limpia token y estado, navega a login.
   */
  async logout(): Promise<void> {
    await this.clearStoredToken();
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    // No deben quedar datos de esta cuenta en el teléfono ni en memoria.
    this.offlineStore.clearAll();
    this.injector.get(HarvestFacade).reset();
    await this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  /**
   * Cambiar contraseña del usuario actual.
   * Requiere contraseña actual y nueva contraseña.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.authService.changePassword({ currentPassword, newPassword }).toPromise();
    } catch (err: any) {
      this._error.set(apiErrorMessage(err, 'No se pudo cambiar la contraseña. Intenta de nuevo.'));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  // --- SecureStorage helpers ---

  private async storeToken(token: string): Promise<void> {
    await SecureStorage.set(TOKEN_KEY, token);
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      const result = await SecureStorage.get(TOKEN_KEY);
      return typeof result === 'string' ? result : null;
    } catch {
      return null;
    }
  }

  private async clearStoredToken(): Promise<void> {
    try {
      await SecureStorage.remove(TOKEN_KEY);
    } catch {
      // ignorar
    }
  }
}