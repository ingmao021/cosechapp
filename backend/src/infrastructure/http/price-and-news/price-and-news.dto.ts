import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCoffeePriceDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  value!: number;

  @IsOptional()
  @IsString()
  queryDate?: string;
}
