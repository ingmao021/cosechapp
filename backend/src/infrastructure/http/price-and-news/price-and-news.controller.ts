import { Controller, Post, Get, Param, Body, Patch, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { PriceAndNewsService } from './price-and-news.service';
import { CoffeePrice } from '@domain/price-and-news/coffee-price.entity';
import { Notification } from '@domain/price-and-news/notification.entity';
import { NewsArticle } from '@domain/price-and-news/news-article.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { AdminKeyGuard } from '@infrastructure/http/auth/guards/admin-key.guard';
import { AuthUser } from '@infrastructure/http/harvest/harvest.service';
import { UpdateCoffeePriceDto } from './price-and-news.dto';

interface AuthRequest {
  user: AuthUser;
}

@Controller('price-and-news')
export class PriceAndNewsController {
  constructor(private readonly priceAndNewsService: PriceAndNewsService) {}

  /** Lo usa un proceso del sistema (no la app): exige x-admin-key, no JWT. */
  @Post('coffee-price')
  @UseGuards(AdminKeyGuard)
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
  async getCoffeePriceHistory() {
    const prices = await this.priceAndNewsService.getCoffeePriceHistory();
    return prices.map(toCoffeePriceResponse);
  }

  /** Lo llama el job diario (GitHub Actions): precio FNC (web), noticias (RSS) y análisis (Gemini gratis). */
  @Post('ai/refresh')
  @UseGuards(AdminKeyGuard)
  refreshCoffeeIntel() {
    return this.priceAndNewsService.refreshCoffeeIntel();
  }

  @Get('coffee-price/analysis')
  @UseGuards(JwtAuthGuard)
  async getPriceAnalysis(@Res({ passthrough: true }) res: Response) {
    this.priceAndNewsService.refreshIfStale();
    const insight = await this.priceAndNewsService.getPriceAnalysis();
    if (!insight) {
      res.status(HttpStatus.NO_CONTENT);
      return;
    }
    return { text: insight.text, generatedAt: insight.createdAt, basedOnPriceId: insight.coffeePriceId };
  }

  /** Noticias del café (RSS de Google Noticias, elegidas con IA), de la más nueva a la más vieja. */
  @Get('news')
  @UseGuards(JwtAuthGuard)
  async getNews() {
    this.priceAndNewsService.refreshIfStale();
    return (await this.priceAndNewsService.getNews()).map(toNewsResponse);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(@Request() req: AuthRequest) {
    const notifications = await this.priceAndNewsService.getNotificationsByCoffeeGrower(req.user.userId);
    return notifications.map(({ notification, priceValue }) => toNotificationResponse(notification, priceValue));
  }

  @Get('notifications/unread')
  @UseGuards(JwtAuthGuard)
  async getUnreadNotifications(@Request() req: AuthRequest) {
    const notifications = await this.priceAndNewsService.getUnreadNotificationsByCoffeeGrower(req.user.userId);
    return notifications.map(({ notification, priceValue }) => toNotificationResponse(notification, priceValue));
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
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

function toNewsResponse(article: NewsArticle) {
  return {
    id: article.id,
    kind: article.kind,
    title: article.title,
    source: article.source,
    summary: article.summary,
    url: article.url,
    publishedAt: article.publishedAt,
  };
}
