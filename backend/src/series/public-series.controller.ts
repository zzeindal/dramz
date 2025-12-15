import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SeriesService } from './series.service';
import { PurchaseSeriesDto } from './dto/purchase-series.dto';
import { RecordViewDto } from './dto/record-view.dto';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';
import { OptionalUserJwtAuthGuard } from '../auth/guards/optional-user-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@ApiTags('series-public')
@Controller('series')
export class PublicSeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить список видимых сериалов',
    description: 'Возвращает список всех сериалов, которые видимы для пользователей (isVisible: true)',
  })
  @ApiResponse({
    status: 200,
    description: 'Список видимых сериалов',
  })
  async findAll() {
    return this.seriesService.findVisible();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить информацию о сериале',
    description: 'Возвращает информацию о сериале по ID. Сериал должен быть видимым (isVisible: true)',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({
    status: 200,
    description: 'Информация о сериале',
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал не найден или не видим' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.seriesService.findOneVisible(id);
  }

  @Post(':id/purchase')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Купить сериал',
    description: 'Покупает сериал за короны. Списывает короны с баланса пользователя, создает запись о покупке и транзакцию. Требует access-token в заголовке Authorization.',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({
    status: 201,
    description: 'Сериал успешно куплен',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        user: { type: 'object', description: 'Обновленный пользователь' },
        series: { type: 'object', description: 'Купленный сериал' },
        purchase: { type: 'object', description: 'Запись о покупке' },
        newBalance: { type: 'number', description: 'Новый баланс корон' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID или недостаточно корон или сериал уже куплен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сериал или пользователь не найдены' })
  async purchaseSeries(@Param('id', ParseObjectIdPipe) id: string, @CurrentUser() user: any) {
    return this.seriesService.purchaseSeries(id, user.telegramId);
  }

  @Get(':id/episodes')
  @ApiOperation({
    summary: 'Получить список эпизодов сериала',
    description: 'Возвращает список всех эпизодов сериала. Первые N эпизодов (freeEpisodesCount) доступны бесплатно. Токен опционален - если передан access-token и сериал куплен, возвращает полную информацию об эпизодах.',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({
    status: 200,
    description: 'Список эпизодов сериала',
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал не найден' })
  async getEpisodes(
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.seriesService.getEpisodes(id);
  }

  @Get(':id/episodes/:episodeNumber')
  @UseGuards(OptionalUserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить информацию об эпизоде',
    description: 'Возвращает информацию об эпизоде. Первые N эпизодов (freeEpisodesCount) доступны бесплатно без покупки. Для платных эпизодов требуется авторизация через access-token в заголовке Authorization. Токен опционален.',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiParam({ name: 'episodeNumber', description: 'Номер эпизода', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Информация об эпизоде',
    schema: {
      type: 'object',
      properties: {
        series: { type: 'object' },
        episode: { type: 'object' },
        isPurchased: { type: 'boolean', description: 'Куплен ли сериал' },
        isFree: { type: 'boolean', description: 'Является ли эпизод бесплатным' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал или эпизод не найдены' })
  async getEpisode(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('episodeNumber', ParseIntPipe) episodeNumber: number,
    @CurrentUser() user?: any,
  ) {
    const telegramId = user?.telegramId;
    return this.seriesService.getEpisode(id, episodeNumber, telegramId);
  }

  @Post(':id/episodes/:episodeNumber/view')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Записать просмотр эпизода',
    description: 'Создает запись о просмотре эпизода. Сериал должен быть куплен пользователем. Требует access-token в заголовке Authorization.',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiParam({ name: 'episodeNumber', description: 'Номер эпизода', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Просмотр успешно записан',
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID или сериал должен быть куплен перед просмотром' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сериал, эпизод или пользователь не найдены' })
  async recordView(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('episodeNumber', ParseIntPipe) episodeNumber: number,
    @CurrentUser() user: any,
  ) {
    return this.seriesService.recordView(id, episodeNumber, user.telegramId);
  }
}

