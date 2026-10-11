import { IsString, IsNumber, IsPositive, MaxLength, MinLength, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenHarvestDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  pricePerKilogram!: number;
}

export class UpdateHarvestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  pricePerKilogram?: number;
}

/** Campos sin enviar no cambian; null en crewId lo deja sin cuadrilla y en harvestAlias quita el alias. */
export class UpdatePickerDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  crewId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(50)
  harvestAlias?: string | null;
}

export class AssignWorkerDto {
  @IsString()
  workerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  harvestAlias?: string;

  @IsOptional()
  @IsString()
  crewId?: string;
}

export class CreateCrewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class UpdateCrewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
