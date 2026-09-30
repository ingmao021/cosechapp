import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  nationalId: string;
  password: string;
}

export interface RegisterRequest {
  nationalId: string;
  password: string;
  profilePhoto?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  coffeeGrower: {
    id: string;
    nationalId: string;
    profilePhoto?: string;
    createdAt: string;
  };
  accessToken: string;
}

export interface MeResponse {
  id: string;
  nationalId: string;
  profilePhoto?: string;
  createdAt: string;
}

/**
 * Servicio HTTP para autenticación.
 * Wrapper tipado sobre los endpoints del AuthController del backend.
 * No contiene lógica de negocio ni estado — solo llamadas HTTP puras.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  login(dto: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, dto);
  }

  register(dto: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, dto);
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`);
  }

  changePassword(dto: ChangePasswordRequest): Observable<void> {
    // TODO: Backend endpoint no existe aún - ver wiki/frontend-findings.md
    // return this.http.post<void>(`${this.baseUrl}/change-password`, dto);
    // Por ahora simulamos éxito para no bloquear el frontend
    return new Observable(subscriber => {
      setTimeout(() => {
        subscriber.next();
        subscriber.complete();
      }, 500);
    });
  }
}