import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FaqService } from './faq.service';

@ApiTags('faq-public')
@Controller('faq')
export class PublicFaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить список видимых FAQ',
    description: 'Возвращает список всех видимых FAQ, отсортированных по порядку отображения. Публичный endpoint, не требует авторизации.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список видимых FAQ',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          question: { type: 'string' },
          answer: { type: 'string' },
          order: { type: 'number' },
        },
      },
    },
  })
  async findAll() {
    return this.faqService.findVisible();
  }
}

