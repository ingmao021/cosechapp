import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import {
  CoffeeGrowerAlreadyExistsError,
  CrewNotFoundError,
  DomainError,
  EntityNotFoundError,
  HarvestAlreadyActiveError,
  HarvestAlreadyClosedError,
  HarvestNotActiveError,
  BusinessRuleViolationError,
  IdempotencyKeyConflictError,
  WorkerHasHarvestHistoryError,
  IncorrectCurrentPasswordError,
  InvalidCredentialsError,
  PickerNotFoundError,
  ResourceNotFoundError,
  SaleAlreadyRecordedError,
  WorkerNotFoundError,
} from '@shared/errors/domain-errors';

/**
 * Código HTTP de cada error de dominio (ver "Contrato de API" en wiki/Design_System.md):
 * 401 credenciales, 404 no existe o es de otro usuario, 409 conflicto con el estado
 * actual, 422 regla de negocio, 400 cualquier otro dato inválido.
 */
export function domainErrorStatus(error: DomainError): HttpStatus {
  if (error instanceof InvalidCredentialsError) return HttpStatus.UNAUTHORIZED;
  if (
    error instanceof EntityNotFoundError ||
    error instanceof PickerNotFoundError ||
    error instanceof CrewNotFoundError ||
    error instanceof WorkerNotFoundError ||
    error instanceof ResourceNotFoundError
  ) {
    return HttpStatus.NOT_FOUND;
  }
  if (
    error instanceof CoffeeGrowerAlreadyExistsError ||
    error instanceof HarvestAlreadyActiveError ||
    error instanceof HarvestAlreadyClosedError ||
    error instanceof HarvestNotActiveError ||
    error instanceof SaleAlreadyRecordedError ||
    error instanceof IdempotencyKeyConflictError ||
    error instanceof WorkerHasHarvestHistoryError
  ) {
    return HttpStatus.CONFLICT;
  }
  if (error instanceof BusinessRuleViolationError || error instanceof IncorrectCurrentPasswordError) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
  return HttpStatus.BAD_REQUEST;
}

/** Errores de dominio → código HTTP adecuado, en lugar de 500. */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = domainErrorStatus(error);
    response.status(statusCode).json({ statusCode, error: error.name, message: error.message });
  }
}

/**
 * Errores conocidos de Prisma que no son fallas del servidor: registro duplicado (409),
 * registro inexistente (404) o referencia a algo que no existe (409). El resto sigue siendo 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaErrorFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped: Record<string, [HttpStatus, string]> = {
      P2002: [HttpStatus.CONFLICT, 'UniqueConstraintViolation'],
      P2025: [HttpStatus.NOT_FOUND, 'RecordNotFound'],
      P2003: [HttpStatus.CONFLICT, 'ForeignKeyViolation'],
    };
    const [statusCode, name] = mapped[error.code] ?? [HttpStatus.INTERNAL_SERVER_ERROR, 'DatabaseError'];
    response.status(statusCode).json({
      statusCode,
      error: name,
      message: statusCode === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : error.message.split('\n').pop(),
    });
  }
}
