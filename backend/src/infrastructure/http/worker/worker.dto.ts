import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  /** Opcional: la app registra un solo campo "Nombre o alias" (va en firstName). */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  alias?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}

export class UpdateWorkerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  /** Opcional: la app registra un solo campo "Nombre o alias" (va en firstName). */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  alias?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}
