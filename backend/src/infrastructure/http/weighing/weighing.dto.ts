import { IsString, IsNumber, IsPositive, IsOptional, IsUUID, IsDateString, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordWeighingDto {
  /** Id generado en el teléfono (UUID) para que reenviar la misma pesada no la duplique. */
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  harvestPickerId!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(1000)
  @Type(() => Number)
  kilograms!: number;

  @IsOptional()
  @IsDateString()
  dateTime?: string;
}

export class DateRangeQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
