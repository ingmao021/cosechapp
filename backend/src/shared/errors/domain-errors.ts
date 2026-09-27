export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" not found`);
  }
}

export class HarvestAlreadyActiveError extends DomainError {
  constructor() {
    super('There is already an active harvest. Close it before opening a new one.');
  }
}

export class HarvestNotActiveError extends DomainError {
  constructor() {
    super('No active harvest found');
  }
}

export class HarvestAlreadyClosedError extends DomainError {
  constructor() {
    super('Harvest is already closed');
  }
}

export class PickerNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Picker "${identifier}" not found in this harvest`);
  }
}

export class CrewNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Crew "${identifier}" not found in this harvest`);
  }
}

export class WorkerNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Worker "${identifier}" not found`);
  }
}

export class InvalidPaymentAmountError extends DomainError {
  constructor() {
    super('Payment amount must be negative');
  }
}

export class InvalidKilogramsError extends DomainError {
  constructor() {
    super('Kilograms must be a positive number');
  }
}

export class SaleAlreadyRecordedError extends DomainError {
  constructor() {
    super('Sale already recorded for this harvest');
  }
}

export class CoffeeGrowerAlreadyExistsError extends DomainError {
  constructor(nationalId: string) {
    super(`Coffee grower with national ID "${nationalId}" already exists`);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid national ID or password');
  }
}