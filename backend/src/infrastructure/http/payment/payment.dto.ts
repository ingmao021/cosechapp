import { IsString, IsBoolean, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PayNowDto {
  @IsString()
  harvestPickerId!: string;

  @IsString()
  harvestId!: string;

  @IsBoolean()
  includesMeals!: boolean;

  /** Alimentación por día (COP): se descuenta por cada día con pesadas desde el último pago. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Type(() => Number)
  mealPerDay?: number;

  /** Valor total a descontar por alimentación (COP). Lo envían apps anteriores. */
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
  mealPerDay?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Type(() => Number)
  mealDeduction?: number;
}
