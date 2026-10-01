import { BusinessRuleViolationError } from '@shared/errors/domain-errors';
import { HarvestPickerStatus } from './harvest-picker-status.enum';

export class HarvestWorker {
  private constructor(
    public readonly id: string,
    public readonly harvestId: string,
    public readonly workerId: string,
    public readonly harvestAlias: string | null,
    public readonly crewId: string | null,
    public readonly status: HarvestPickerStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    harvestId: string,
    workerId: string,
    harvestAlias: string | null = null,
    crewId: string | null = null,
  ): HarvestWorker {
    const now = new Date();
    return new HarvestWorker(
      id,
      harvestId,
      workerId,
      harvestAlias,
      crewId,
      HarvestPickerStatus.ACTIVE,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    harvestId: string,
    workerId: string,
    harvestAlias: string | null,
    crewId: string | null,
    status: HarvestPickerStatus,
    createdAt: Date,
    updatedAt: Date,
  ): HarvestWorker {
    return new HarvestWorker(
      id,
      harvestId,
      workerId,
      harvestAlias,
      crewId,
      status,
      createdAt,
      updatedAt,
    );
  }

  archive(): HarvestWorker {
    if (this.status === HarvestPickerStatus.ARCHIVED) {
      throw new BusinessRuleViolationError('Harvest worker is already archived');
    }
    return HarvestWorker.reconstitute(
      this.id,
      this.harvestId,
      this.workerId,
      this.harvestAlias,
      this.crewId,
      HarvestPickerStatus.ARCHIVED,
      this.createdAt,
      new Date(),
    );
  }

  assignToCrew(crewId: string): HarvestWorker {
    return HarvestWorker.reconstitute(
      this.id,
      this.harvestId,
      this.workerId,
      this.harvestAlias,
      crewId,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  removeFromCrew(): HarvestWorker {
    return HarvestWorker.reconstitute(
      this.id,
      this.harvestId,
      this.workerId,
      this.harvestAlias,
      null,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  updateAlias(alias: string | null): HarvestWorker {
    return HarvestWorker.reconstitute(
      this.id,
      this.harvestId,
      this.workerId,
      alias,
      this.crewId,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  isActive(): boolean {
    return this.status === HarvestPickerStatus.ACTIVE;
  }

  isArchived(): boolean {
    return this.status === HarvestPickerStatus.ARCHIVED;
  }
}