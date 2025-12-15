import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { DateRangeDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить общую статистику',
    description: `Возвращает общую статистику по платформе:
    - Количество пользователей (общее и за период)
    - Количество просмотров (общее и за период)
    - Доходы в разных валютах (USD, RUB, Telegram Stars) из покупок корон
    - Статистика покупок: потрачено корон на сериалы, количество покупок
    - Просмотры по каждой серии сериала (с сортировкой по популярности)
    
    Можно указать период через параметры startDate и endDate для фильтрации данных.`,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата периода (формат: YYYY-MM-DD). Опционально.',
    required: false,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата периода (формат: YYYY-MM-DD). Опционально.',
    required: false,
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Общая статистика успешно получена',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Общее количество пользователей' },
            inRange: { type: 'number', description: 'Количество пользователей за период' },
          },
        },
        views: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Общее количество просмотров' },
          },
        },
        revenue: {
          type: 'object',
          properties: {
            usd: { type: 'number', description: 'Доход в USD' },
            rub: { type: 'number', description: 'Доход в RUB' },
            telegramStars: { type: 'number', description: 'Доход в Telegram Stars' },
            totalUsd: { type: 'number', description: 'Общий доход в USD (примерный расчет)' },
          },
        },
        purchases: {
          type: 'object',
          properties: {
            totalCrownsSpent: { type: 'number', description: 'Всего потрачено корон на покупку сериалов' },
            totalPurchases: { type: 'number', description: 'Количество покупок сериалов' },
            totalCrownPurchases: { type: 'number', description: 'Количество покупок корон за USDT' },
          },
        },
        viewsByEpisode: {
          type: 'array',
          description: 'Просмотры по каждой серии каждого сериала',
          items: {
            type: 'object',
            properties: {
              seriesId: { type: 'string' },
              seriesTitle: { type: 'string' },
              episodeNumber: { type: 'number' },
              views: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getGeneralStatistics(@Query() dateRange: DateRangeDto) {
    return this.statisticsService.getGeneralStatistics(dateRange);
  }

  @Get('series/:seriesId')
  @ApiOperation({
    summary: 'Получить статистику по конкретному сериалу',
    description: `Возвращает детальную статистику по указанному сериалу:
    - Общее количество просмотров
    - Просмотры по каждой серии (разбивка по номерам серий)
    - Количество покупок
    - Всего потрачено корон на этот сериал
    
    Можно указать период через параметры startDate и endDate для фильтрации данных.`,
  })
  @ApiParam({
    name: 'seriesId',
    description: 'MongoDB ID сериала (ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата периода (формат: YYYY-MM-DD). Опционально.',
    required: false,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата периода (формат: YYYY-MM-DD). Опционально.',
    required: false,
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика по сериалу успешно получена',
    schema: {
      type: 'object',
      properties: {
        series: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID сериала' },
            title: { type: 'string', description: 'Название сериала' },
          },
        },
        views: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Общее количество просмотров' },
            byEpisode: {
              type: 'object',
              description: 'Просмотры по сериям (ключ - номер серии, значение - количество просмотров)',
              additionalProperties: { type: 'number' },
            },
          },
        },
        purchases: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Количество покупок' },
            totalCrownsSpent: { type: 'number', description: 'Всего потрачено корон на этот сериал' },
            currency: { type: 'string', description: 'Валюта', example: 'crowns' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал не найден' })
  async getSeriesStatistics(
    @Param('seriesId', ParseObjectIdPipe) seriesId: string,
    @Query() dateRange: DateRangeDto,
  ) {
    return this.statisticsService.getSeriesStatistics(seriesId, dateRange);
  }
}
