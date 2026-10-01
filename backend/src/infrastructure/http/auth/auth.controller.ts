import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, ChangePasswordDto } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new coffee grower' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register({
      nationalId: dto.nationalId,
      password: dto.password,
      profilePhoto: dto.profilePhoto,
    });
    return {
      coffeeGrower: {
        id: result.coffeeGrower.id,
        nationalId: result.coffeeGrower.nationalId,
        profilePhoto: result.coffeeGrower.profilePhoto,
        createdAt: result.coffeeGrower.createdAt,
      },
      accessToken: result.accessToken,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with national ID and password' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login({
      nationalId: dto.nationalId,
      password: dto.password,
    });
    return {
      coffeeGrower: {
        id: result.coffeeGrower.id,
        nationalId: result.coffeeGrower.nationalId,
        profilePhoto: result.coffeeGrower.profilePhoto,
        createdAt: result.coffeeGrower.createdAt,
      },
      accessToken: result.accessToken,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@Request() req: any) {
    return {
      id: req.user.userId,
      nationalId: req.user.nationalId,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change the current user password' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword({
      coffeeGrowerId: req.user.userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }
}
