import { IsString, IsNumber, IsPositive, MaxLength, MinLength, IsOptional } from 'class-validator';
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
