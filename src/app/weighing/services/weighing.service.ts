import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecordWeighingDto {
  /** UUID generado en el teléfono: reenviar la misma pesada no la duplica. */
  id: string;
  harvestPickerId: string;
  kilograms: number;
  dateTime?: string;
}

export interface WeighingResponse {
  id: string;
  harvestPickerId: string;
  kilograms: number;
  dateTime: string;
  createdAt: string;
  updatedAt: string;
}

/** Resultado por pesada de POST /sync/weighings (mismo código que tendría por POST /weighings). */
export interface SyncItemResult {
  id: string;
  status: number;
  error?: string;
  message?: string;
}

/** Servicio HTTP de pesadas: wrapper tipado sobre WeighingController y SyncController. */
@Injectable({ providedIn: 'root' })
export class WeighingService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/weighings`;

  /** 201 si se creó; 200 si esa pesada (mismo id) ya estaba guardada. */
  recordWeighing(dto: RecordWeighingDto): Observable<WeighingResponse> {
    return this.http.post<WeighingResponse>(this.baseUrl, dto);
  }

  /** 200 si todas quedaron guardadas; 207 si alguna fue rechazada (ver cada `status`). */
  syncWeighings(weighings: RecordWeighingDto[]): Observable<{ results: SyncItemResult[] }> {
    return this.http.post<{ results: SyncItemResult[] }>(`${environment.apiUrl}/sync/weighings`, { weighings });
  }

  getWeighingsByPicker(harvestPickerId: string): Observable<WeighingResponse[]> {
    return this.http.get<WeighingResponse[]>(`${this.baseUrl}/picker/${harvestPickerId}`);
  }
}
