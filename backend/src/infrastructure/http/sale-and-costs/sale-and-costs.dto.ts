import { IsString, IsNumber, IsPositive, MinLength, MaxLength, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordSaleDto {
  @IsString()
  harvestId!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  actualDryKilograms!: number;

  /** Precio por kilo seco (COP). */
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  salePrice!: number;

  @IsDateString()
  date!: string;
}

export class AddProductionCostDto {
  @IsString()
  harvestId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description!: string;

  /** Lo que se gastó, en positivo (COP). */
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @IsDateString()
  date!: string;
}

export class ProjectDryKilogramsQueryDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  cherryKilograms!: number;
}
