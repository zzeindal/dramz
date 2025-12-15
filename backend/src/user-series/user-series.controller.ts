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
import { UserSeriesService } from './user-series.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { ToggleBookmarkDto } from './dto/toggle-bookmark.dto';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@ApiTags('user-series')
@Controller('user/series')
export class UserSeriesController {
  constructor(private readonly userSeriesService: UserSeriesService) {}

  @Post(':seriesId/like')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Лайкнуть/убрать лайк с сериала',
    description: 'Переключает статус лайка для сериала. Если лайк уже есть - убирает, если нет - добавляет. Требует access-token в заголовке Authorization.',
  })
  @ApiParam({ name: 'seriesId', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({
    status: 200,
    description: 'Статус лайка успешно изменен',
    schema: {
      type: 'object',
      properties: {
        isLiked: { type: 'boolean', description: 'Лайкнут ли сериал' },
        likesCount: { type: 'number', description: 'Общее количество лайков' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сериал или пользователь не найдены' })
  async toggleLike(@Param('seriesId', ParseObjectIdPipe) seriesId: string, @CurrentUser() user: any) {
    return this.userSeriesService.toggleLike(seriesId, user.telegramId);
  }

  @Post(':seriesId/bookmark')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Сохранить/убрать из сохраненных сериал',
    description: 'Переключает статус сохранения для сериала. Если сохранен - убирает, если нет - добавляет. Требует access-token в заголовке Authorization.',
  })
  @ApiParam({ name: 'seriesId', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({
    status: 200,
    description: 'Статус сохранения успешно изменен',
    schema: {
      type: 'object',
      properties: {
        isBookmarked: { type: 'boolean', description: 'Сохранен ли сериал' },
        bookmarksCount: { type: 'number', description: 'Общее количество сохранений' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сериал или пользователь не найдены' })
  async toggleBookmark(@Param('seriesId', ParseObjectIdPipe) seriesId: string, @CurrentUser() user: any) {
    return this.userSeriesService.toggleBookmark(seriesId, user.telegramId);
  }

  @Get('liked')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить список лайкнутых сериалов',
    description: 'Возвращает все сериалы, которые пользователь лайкнул. Требует access-token в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список лайкнутых сериалов',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getLikedSeries(@CurrentUser() user: any) {
    return this.userSeriesService.getLikedSeries(user.telegramId);
  }

  @Get('bookmarked')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить список сохраненных сериалов',
    description: 'Возвращает все сериалы, которые пользователь сохранил. Требует access-token в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список сохраненных сериалов',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getBookmarkedSeries(@CurrentUser() user: any) {
    return this.userSeriesService.getBookmarkedSeries(user.telegramId);
  }

  @Get(':seriesId/status')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить статус сериала для пользователя',
    description: 'Возвращает информацию о том, лайкнут ли сериал, сохранен ли, и общее количество лайков/сохранений. Требует access-token в заголовке Authorization.',
  })
  @ApiParam({ name: 'seriesId', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({
    status: 200,
    description: 'Статус сериала для пользователя',
    schema: {
      type: 'object',
      properties: {
        isLiked: { type: 'boolean', description: 'Лайкнут ли сериал пользователем' },
        isBookmarked: { type: 'boolean', description: 'Сохранен ли сериал пользователем' },
        likesCount: { type: 'number', description: 'Общее количество лайков' },
        bookmarksCount: { type: 'number', description: 'Общее количество сохранений' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Сериал или пользователь не найдены' })
  async getSeriesStatus(@Param('seriesId', ParseObjectIdPipe) seriesId: string, @CurrentUser() user: any) {
    return this.userSeriesService.checkUserSeriesStatus(seriesId, user.telegramId);
  }
}

