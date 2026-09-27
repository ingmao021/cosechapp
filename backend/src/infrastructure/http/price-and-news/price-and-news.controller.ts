import { Controller, Post, Get, Param, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import { PriceAndNewsService } from './price-and-news.service';
import { CoffeePrice } from '@domain/price-and-news/coffee-price.entity';
import { Notification } from '@domain/price-and-news/notification.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';

@ApiTags('price-and-news')
@Controller('price-and-news')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PriceAndNewsController {
  constructor(private readonly priceAndNewsService: PriceAndNewsService) {}

  @Post('coffee-price')
  @ApiOperation({ summary: 'Update coffee price (scraping job endpoint)' })
  async updateCoffeePrice(@Body() dto: UpdateCoffeePriceDto) {
    const result = await this.priceAndNewsService.updateCoffeePrice(
      dto.value,
      dto.queryDate ? new Date(dto.queryDate) : undefined,
    );
    return {
      coffeePrice: this.toCoffeePriceResponse(result.coffeePrice),
      hasChanged: result.hasChanged,
      notificationsCreated: result.notificationsCreated,
    };
  }

  @Get('coffee-price')
  @ApiOperation({ summary: 'Get latest coffee price' })
  async getLatestCoffeePrice() {
    const coffeePrice = await this.priceAndNewsService.getLatestCoffeePrice();
    return coffeePrice ? this.toCoffeePriceResponse(coffeePrice) : null;
  }

  @Get('coffee-price/history')
  @ApiOperation({ summary: 'Get coffee price history' })
  async getCoffeePriceHistory() {
    const prices = await this.priceAndNewsService.getCoffeePriceHistory();
    return prices.map(this.toCoffeePriceResponse);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications for current user' })
  async getNotifications(@Request() req: any) {
    const notifications = await this.priceAndNewsService.getNotificationsByCoffeeGrower(req.user.userId);
    return notifications.map(this.toNotificationResponse);
  }

  @Get('notifications/unread')
  @ApiOperation({ summary: 'Get unread notifications for current user' })
  async getUnreadNotifications(@Request() req: any) {
    const notifications = await this.priceAndNewsService.getUnreadNotificationsByCoffeeGrower(req.user.userId);
    return notifications.map(this.toNotificationResponse);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(@Param('id') id: string) {
    const notification = await this.priceAndNewsService.markNotificationAsRead(id);
    return notification ? this.toNotificationResponse(notification) : null;
  }

  private toCoffeePriceResponse(coffeePrice: CoffeePrice) {
    return {
      id: coffeePrice.id,
      value: coffeePrice.value,
      queryDate: coffeePrice.queryDate,
      createdAt: coffeePrice.createdAt,
    };
  }

  private toNotificationResponse(notification: Notification) {
    return {
      id: notification.id,
      coffeeGrowerId: notification.coffeeGrowerId,
      type: notification.type,
      date: notification.date,
      read: notification.read,
      createdAt: notification.createdAt,
    };
  }
}

export class UpdateCoffeePriceDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  value!: number;

  @IsOptional()
  @IsString()
  queryDate?: string;
}