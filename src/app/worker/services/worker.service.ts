import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// DTOs matching backend WorkerController
export interface CreateWorkerDto {
  firstName: string;
  lastName: string;
  alias?: string;
  phoneNumber?: string;
}

export interface UpdateWorkerDto {
  firstName: string;
  lastName: string;
  alias?: string;
  phoneNumber?: string;
}

export interface WorkerResponse {
  id: string;
  firstName: string;
  lastName: string;
  alias: string | null;
  phoneNumber: string | null;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio HTTP para catálogo de trabajadores.
 * Wrapper tipado sobre los endpoints del WorkerController del backend.
 */
@Injectable({ providedIn: 'root' })
export class WorkerService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/workers`;

  createWorker(dto: CreateWorkerDto): Observable<WorkerResponse> {
    return this.http.post<WorkerResponse>(this.baseUrl, dto);
  }

  listWorkers(): Observable<WorkerResponse[]> {
    return this.http.get<WorkerResponse[]>(this.baseUrl);
  }

  getWorker(id: string): Observable<WorkerResponse> {
    return this.http.get<WorkerResponse>(`${this.baseUrl}/${id}`);
  }

  updateWorker(id: string, dto: UpdateWorkerDto): Observable<WorkerResponse> {
    return this.http.patch<WorkerResponse>(`${this.baseUrl}/${id}`, dto);
  }

  deleteWorker(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}