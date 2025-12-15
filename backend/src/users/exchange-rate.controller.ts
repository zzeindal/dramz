import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExchangeRateService } from './exchange-rate.service';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('exchange-rate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить текущий курс корон',
    description: 'Возвращает текущий активный курс обмена корон на рубли, USD и Telegram Stars.',
  })
  @ApiResponse({
    status: 200,
    description: 'Текущий курс корон',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        rubPerCrown: { type: 'number', description: '1 корона = X рублей', example: 1 },
        usdPerCrown: { type: 'number', description: '1 корона = X USD', example: 0.01 },
        telegramStarPerCrown: { type: 'number', description: '1 корона = X Telegram Stars', example: 1 },
        isActive: { type: 'boolean' },
        changedBy: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getCurrentRate() {
    return this.exchangeRateService.getCurrentRate();
  }

  @Get('history')
  @ApiOperation({
    summary: 'Получить историю изменения курсов',
    description: 'Возвращает всю историю изменения курсов корон (включая неактивные).',
  })
  @ApiResponse({
    status: 200,
    description: 'История курсов',
  })
  async getRateHistory() {
    return this.exchangeRateService.getRateHistory();
  }

  @Put()
  @ApiOperation({
    summary: 'Обновить курс корон',
    description: 'Обновляет курс обмена корон. Старый курс деактивируется, создается новый активный курс. Все поля опциональны - обновляются только указанные.',
  })
  @ApiBody({
    type: UpdateExchangeRateDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Курс успешно обновлен',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        rubPerCrown: { type: 'number', example: 1 },
        usdPerCrown: { type: 'number', example: 0.01 },
        telegramStarPerCrown: { type: 'number', example: 1 },
        isActive: { type: 'boolean', example: true },
        changedBy: { type: 'string', example: 'admin' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async updateRate(@Body() updateDto: UpdateExchangeRateDto, @Req() req: any) {
    const adminUsername = req.user?.username;
    return this.exchangeRateService.updateRate(updateDto, adminUsername);
  }
}

