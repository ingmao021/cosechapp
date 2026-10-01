import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  nationalId!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}

export class LoginDto {
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  nationalId!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword!: string;
}
