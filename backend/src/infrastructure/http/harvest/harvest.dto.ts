import { IsString, IsNumber, IsPositive, MaxLength, MinLength, IsOptional, ValidateIf, IsBoolean, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

/** Cierre: si hubo alimentación, mealPerDay se le descuenta a todos por cada día que pesaron. */
export class CloseHarvestDto {
  @IsOptional()
  @IsBoolean()
  includesMeals?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  @Type(() => Number)
  mealPerDay?: number;
}

export class ClosePreviewQueryDto {
  @IsOptional()
  @IsIn([true, false])
  @Transform(({ value }) => value === true || value === 'true')
  includesMeals?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  @Type(() => Number)
  mealPerDay?: number;
}
