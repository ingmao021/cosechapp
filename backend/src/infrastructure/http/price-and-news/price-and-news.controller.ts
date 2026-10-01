import { Controller, Post, Get, Param, Body, Patch, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Response } from 'express';

import { PriceAndNewsService } from './price-and-news.service';
import { CoffeePrice } from '@domain/price-and-news/coffee-price.entity';
import { Notification } from '@domain/price-and-news/notification.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { AdminKeyGuard } from '@infrastructure/http/auth/guards/admin-key.guard';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { UpdateCoffeePriceDto } from './price-and-news.dto';

interface AuthRequest {
  user: AuthUser;
}

@ApiTags('price-and-news')
@Controller('price-and-news')
export class PriceAndNewsController {
  constructor(private readonly priceAndNewsService: PriceAndNewsService) {}

  /** Lo usa un proceso del sistema (no la app): exige x-admin-key, no JWT. */
  @Post('coffee-price')
  @UseGuards(AdminKeyGuard)
  @ApiHeader({ name: 'x-admin-key', required: true })
  @ApiOperation({ summary: 'Publish the FNC coffee price (system job)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 403, description: 'Missing or wrong admin key' })
  async updateCoffeePrice(@Body() dto: UpdateCoffeePriceDto) {
    const result = await this.priceAndNewsService.updateCoffeePrice(
      dto.value,
      dto.queryDate ? new Date(dto.queryDate) : undefined,
    );
    return {
      coffeePrice: toCoffeePriceResponse(result.coffeePrice),
      hasChanged: result.hasChanged,
      notificationsCreated: result.notificationsCreated,
    };
  }

  @Get('coffee-price')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest coffee price' })
  @ApiResponse({ status: 204, description: 'No price published yet' })
  async getLatestCoffeePrice(@Res({ passthrough: true }) res: Response) {
    const coffeePrice = await this.priceAndNewsService.getLatestCoffeePrice();
    if (!coffeePrice) {
      res.status(HttpStatus.NO_CONTENT);
      return;
    }
    return toCoffeePriceResponse(coffeePrice);
  }

  @Get('coffee-price/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coffee price history' })
  async getCoffeePriceHistory() {
    const prices = await this.priceAndNewsService.getCoffeePriceHistory();
    return prices.map(toCoffeePriceResponse);
  }

  /** Sin fuente de noticias todavía: lista vacía (la app muestra un estado vacío honesto). */
  @Get('news')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'News and tips from FNC and Cenicafé' })
  getNews() {
    return [];
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notifications for current user' })
  async getNotifications(@Request() req: AuthRequest) {
    const notifications = await this.priceAndNewsService.getNotificationsByCoffeeGrower(req.user.userId);
    return notifications.map(({ notification, priceValue }) => toNotificationResponse(notification, priceValue));
  }

  @Get('notifications/unread')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notifications for current user' })
  async getUnreadNotifications(@Request() req: AuthRequest) {
    const notifications = await this.priceAndNewsService.getUnreadNotificationsByCoffeeGrower(req.user.userId);
    return notifications.map(({ notification, priceValue }) => toNotificationResponse(notification, priceValue));
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(@Request() req: AuthRequest, @Param('id') id: string) {
    return toNotificationResponse(await this.priceAndNewsService.markNotificationAsRead(req.user.userId, id), null);
  }
}

function toCoffeePriceResponse(coffeePrice: CoffeePrice) {
  return {
    id: coffeePrice.id,
    value: coffeePrice.value,
    queryDate: coffeePrice.queryDate,
    createdAt: coffeePrice.createdAt,
  };
}

function toNotificationResponse(notification: Notification, priceValue: number | null) {
  return {
    priceValue,
    id: notification.id,
    coffeeGrowerId: notification.coffeeGrowerId,
    type: notification.type,
    date: notification.date,
    read: notification.read,
    createdAt: notification.createdAt,
  };
}
