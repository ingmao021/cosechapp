import { IsString, IsBoolean, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PayNowDto {
  @IsString()
  harvestPickerId!: string;

  @IsString()
  harvestId!: string;

  @IsBoolean()
  includesMeals!: boolean;

  /** Valor a descontar por alimentación (COP). Solo aplica si includesMeals es true. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Type(() => Number)
  mealDeduction?: number;
}

export class PaymentPreviewQueryDto {
  @IsString()
  harvestId!: string;

  @IsOptional()
  @IsIn([true, false])
  @Transform(({ value }) => value === true || value === 'true')
  includesMeals?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Type(() => Number)
  mealDeduction?: number;
}
