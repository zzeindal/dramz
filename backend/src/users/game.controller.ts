import { Controller, Get, Post, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GameService } from './game.service';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('state')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить состояние игры',
    description: 'Возвращает текущее состояние игры пользователя: количество жизней, доступность игры, время следующей доступной игры. Требует access-token в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Состояние игры',
    schema: {
      type: 'object',
      properties: {
        lives: { type: 'number', description: 'Текущее количество жизней (0-3)' },
        maxLives: { type: 'number', description: 'Максимальное количество жизней (3)' },
        canPlay: { type: 'boolean', description: 'Можно ли играть сейчас' },
        nextPlayAvailableAt: { type: 'string', format: 'date-time', description: 'Время, когда игра снова станет доступна (если canPlay = false)' },
        lastPlayedAt: { type: 'string', format: 'date-time', nullable: true, description: 'Время последней игры' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getGameState(@CurrentUser() user: any) {
    return this.gameService.getGameState(user.telegramId);
  }

  @Post('play')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Сыграть в игру',
    description: 'Запускает игру для пользователя. Автоматически проверяет доступность игры (прошло ли 1 час), наличие жизней, розыгрывает приз и уменьшает жизни. Требует access-token в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Игра успешно сыграна',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        reward: {
          type: 'object',
          properties: {
            rewardType: { type: 'string', enum: ['small', 'medium', 'large', 'super_rare'] },
            crownsAmount: { type: 'number', nullable: true, description: 'Количество корон (если приз - короны)' },
            seriesId: { type: 'string', nullable: true, description: 'ID сериала (если приз - бесплатный просмотр)' },
            seriesTitle: { type: 'string', nullable: true, description: 'Название сериала (если приз - бесплатный просмотр)' },
          },
        },
        remainingLives: { type: 'number', description: 'Оставшиеся жизни после игры' },
        nextPlayAvailableAt: { type: 'string', format: 'date-time', description: 'Время, когда игра снова станет доступна' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Игра недоступна (не прошло 1 час или закончились жизни)' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async playGame(@CurrentUser() user: any) {
    return this.gameService.playGame(user.telegramId);
  }

  @Get('rewards/history')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить историю наград',
    description: 'Возвращает историю наград пользователя за игры. Требует access-token в заголовке Authorization.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество записей для возврата (по умолчанию 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'История наград',
    schema: {
      type: 'object',
      properties: {
        rewards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rewardType: { type: 'string', enum: ['small', 'medium', 'large', 'super_rare'] },
              crownsAmount: { type: 'number', nullable: true },
              series: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                },
              },
              rewardedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getRewardHistory(
    @CurrentUser() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const rewards = await this.gameService.getRewardHistory(user.telegramId, limit || 10);
    return { rewards };
  }
}

