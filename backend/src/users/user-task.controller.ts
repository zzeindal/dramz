import { Controller, Get, Post, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('user-tasks')
@Controller('user/tasks')
export class UserTaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить активные задания',
    description: 'Возвращает список активных заданий для пользователя с информацией о возможности выполнения. Требует access-token в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список активных заданий',
    schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              reward: { type: 'number' },
              type: { type: 'string', enum: ['manual', 'like_series', 'watch_series', 'invite_referral'] },
              link: { type: 'string', nullable: true },
              canComplete: { type: 'boolean' },
              nextAvailableAt: { type: 'string', format: 'date-time', nullable: true },
              lastCompletedAt: { type: 'string', format: 'date-time', nullable: true },
              status: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getActiveTasks(@CurrentUser() user: any) {
    const tasks = await this.taskService.getActiveTasksForUser(user.telegramId);
    return { tasks };
  }

  @Post(':taskId/complete')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Выполнить задание',
    description: 'Отмечает задание как выполненное. Для ручных заданий требуется указать ссылку на доказательство выполнения (например, ссылку на репост из Instagram). Создается запись на модерацию. Для автоматических заданий награда выдается сразу. Требует access-token в заголовке Authorization.',
  })
  @ApiBody({ type: CompleteTaskDto })
  @ApiResponse({
    status: 200,
    description: 'Задание отмечено как выполненное',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        completion: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Задание нельзя выполнить (не прошло 24 часа, задание автоматическое, или не указана ссылка для ручных заданий)' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  async completeTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
    @Body() completeTaskDto: CompleteTaskDto,
  ) {
    const completion = await this.taskService.completeTask(user.telegramId, taskId, completeTaskDto.link);
    return {
      success: true,
      message: 'Задание отправлено на модерацию. Награда будет зачислена в течение 24 часов после проверки.',
      completion: {
        id: completion._id,
        status: completion.status,
        completedAt: completion.completedAt,
      },
    };
  }

  @Get('history')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить историю выполнения заданий',
    description: 'Возвращает историю выполнения заданий пользователем. Требует access-token в заголовке Authorization.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество записей для возврата (по умолчанию 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'История выполнения заданий',
    schema: {
      type: 'object',
      properties: {
        completions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              task: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  reward: { type: 'number' },
                  type: { type: 'string' },
                },
              },
              status: { type: 'string' },
              completedAt: { type: 'string', format: 'date-time' },
              rewardedAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getTaskHistory(
    @CurrentUser() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const completions = await this.taskService.getUserTaskHistory(user.telegramId, limit || 20);
    return { completions };
  }
}

