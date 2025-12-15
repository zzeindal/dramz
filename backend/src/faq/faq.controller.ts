import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@ApiTags('faq')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать новый FAQ',
    description: 'Создает новый вопрос-ответ для FAQ. Можно указать порядок отображения и видимость.',
  })
  @ApiBody({ type: CreateFaqDto })
  @ApiResponse({ status: 201, description: 'FAQ успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async create(@Body() createFaqDto: CreateFaqDto) {
    return this.faqService.create(createFaqDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех FAQ',
    description: 'Возвращает список всех FAQ (включая скрытые), отсортированных по порядку отображения.',
  })
  @ApiResponse({ status: 200, description: 'Список FAQ успешно получен' })
  async findAll() {
    return this.faqService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить FAQ по ID',
    description: 'Возвращает информацию о конкретном FAQ по его ID.',
  })
  @ApiParam({ name: 'id', description: 'ID FAQ (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'FAQ найден' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'FAQ не найден' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.faqService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Редактировать FAQ',
    description: 'Обновляет информацию о FAQ. Все поля опциональны.',
  })
  @ApiParam({ name: 'id', description: 'ID FAQ (MongoDB ObjectId)' })
  @ApiBody({ type: UpdateFaqDto })
  @ApiResponse({ status: 200, description: 'FAQ успешно обновлен' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID или неверные данные запроса' })
  @ApiResponse({ status: 404, description: 'FAQ не найден' })
  async update(@Param('id', ParseObjectIdPipe) id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.faqService.update(id, updateFaqDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить FAQ',
    description: 'Удаляет FAQ. Внимание: операция необратима!',
  })
  @ApiParam({ name: 'id', description: 'ID FAQ (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'FAQ успешно удален' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'FAQ не найден' })
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    await this.faqService.delete(id);
    return { success: true, message: 'FAQ deleted successfully' };
  }
}

