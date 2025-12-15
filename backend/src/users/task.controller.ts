import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ModerateTaskDto } from './dto/moderate-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';

@ApiTags('admin-tasks')
@Controller('admin/tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать задание',
    description: 'Создает новое задание в системе. Требует авторизации админа.',
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, description: 'Задание успешно создано', type: CreateTaskDto })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async createTask(@Body() createTaskDto: CreateTaskDto, @CurrentAdmin() admin: any) {
    return this.taskService.createTask(createTaskDto, admin.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить все задания',
    description: 'Возвращает список всех заданий в системе. Требует авторизации админа.',
  })
  @ApiResponse({ status: 200, description: 'Список заданий' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getAllTasks() {
    return this.taskService.getAllTasks();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить задание по ID',
    description: 'Возвращает информацию о конкретном задании. Требует авторизации админа.',
  })
  @ApiResponse({ status: 200, description: 'Информация о задании' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getTaskById(@Param('id') id: string) {
    return this.taskService.getTaskById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Обновить задание',
    description: 'Обновляет информацию о задании. Требует авторизации админа.',
  })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: 200, description: 'Задание успешно обновлено', type: UpdateTaskDto })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async updateTask(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.updateTask(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить задание',
    description: 'Удаляет задание из системы. Требует авторизации админа.',
  })
  @ApiResponse({ status: 200, description: 'Задание успешно удалено' })
  @ApiResponse({ status: 404, description: 'Задание не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async deleteTask(@Param('id') id: string) {
    await this.taskService.deleteTask(id);
    return { message: 'Task deleted successfully' };
  }

  @Get('completions/pending')
  @ApiOperation({
    summary: 'Получить задания, ожидающие модерации',
    description: 'Возвращает список выполненных заданий, которые требуют ручной модерации. Требует авторизации админа.',
  })
  @ApiResponse({ status: 200, description: 'Список заданий на модерацию' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getPendingCompletions() {
    return this.taskService.getPendingCompletions();
  }

  @Post('completions/:completionId/moderate')
  @ApiOperation({
    summary: 'Модерировать выполнение задания',
    description: 'Одобряет или отклоняет выполнение задания. При одобрении автоматически выдается награда. Требует авторизации админа.',
  })
  @ApiBody({ type: ModerateTaskDto })
  @ApiResponse({ status: 200, description: 'Модерация выполнена' })
  @ApiResponse({ status: 404, description: 'Выполнение задания не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async moderateTaskCompletion(
    @Param('completionId') completionId: string,
    @Body() moderateTaskDto: ModerateTaskDto,
    @CurrentAdmin() admin: any,
  ) {
    return this.taskService.moderateTaskCompletion(
      completionId,
      moderateTaskDto.status,
      admin.id,
      moderateTaskDto.note,
    );
  }
}

