import { IsArray, ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RecordWeighingDto } from '@infrastructure/http/weighing/weighing.dto';

/** Pesadas guardadas en el teléfono sin señal. Cada una debe traer su id (UUID). */
export class SyncWeighingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => RecordWeighingDto)
  weighings!: RecordWeighingDto[];
}
