import { HttpStatus, Injectable } from '@nestjs/common';
import { WeighingService } from '@infrastructure/http/weighing/weighing.service';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { domainErrorStatus } from '@infrastructure/http/domain-error.filter';
import { DomainError } from '@shared/errors/domain-errors';
import { RecordWeighingDto } from '@infrastructure/http/weighing/weighing.dto';

/** Resultado de una pesada del lote, con el mismo código que tendría por POST /weighings. */
export interface SyncItemResult {
  id: string;
  status: number;
  error?: string;
  message?: string;
}

/**
 * Sincroniza pesadas hechas sin señal. Cada una pasa por las mismas reglas que
 * POST /weighings (dueño, recolector activo, cosecha abierta) y es idempotente por id.
 */
@Injectable()
export class SyncService {
  constructor(private readonly weighingService: WeighingService) {}

  async syncWeighings(user: AuthUser, weighings: RecordWeighingDto[]): Promise<SyncItemResult[]> {
    const results: SyncItemResult[] = [];
    // En orden y de a una: el orden importa si hay reglas que dependen de pesadas anteriores.
    for (const item of weighings) {
      const id = item.id ?? '';
      if (!id) {
        results.push({ id, status: HttpStatus.BAD_REQUEST, error: 'MissingId', message: 'Each weighing needs an id' });
        continue;
      }
      try {
        const { created } = await this.weighingService.recordWeighing(user, {
          id,
          harvestPickerId: item.harvestPickerId,
          kilograms: item.kilograms,
          dateTime: item.dateTime ? new Date(item.dateTime) : undefined,
        });
        results.push({ id, status: created ? HttpStatus.CREATED : HttpStatus.OK });
      } catch (error: unknown) {
        if (!(error instanceof DomainError)) throw error;
        results.push({ id, status: domainErrorStatus(error), error: error.name, message: error.message });
      }
    }
    return results;
  }
}
