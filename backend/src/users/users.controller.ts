import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Поиск пользователя',
    description: 'Ищет пользователя по Telegram ID (число) или username. Возвращает полную информацию о пользователе, включая баланс корон, список покупок, рефералов и данные пригласившего пользователя.',
  })
  @ApiQuery({
    name: 'query',
    description: 'Telegram ID (число) или username пользователя',
    example: '123456789',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь найден. Возвращает полную информацию о пользователе.',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь не найден',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User not found' },
        found: { type: 'boolean', example: false },
      },
    },
  })
  async searchUser(@Query() searchUserDto: SearchUserDto) {
    const user = await this.usersService.searchUser(searchUserDto.query);
    if (!user) {
      return { message: 'User not found', found: false };
    }
    return {
      found: true,
      ...(await this.usersService.getUserData(user._id.toString())),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить данные пользователя по ID',
    description: 'Возвращает полную информацию о пользователе: баланс корон, активность, список покупок, рефералы, данные пригласившего пользователя.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID пользователя (ObjectId)' })
  @ApiResponse({ status: 200, description: 'Данные пользователя успешно получены' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUser(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.getUserData(id);
  }

  @Get(':id/statistics')
  @ApiOperation({
    summary: 'Получить статистику пользователя',
    description: 'Возвращает детальную статистику пользователя: дата регистрации, последняя активность, сумма покупок, список рефералов с их данными, сумма внутриигровой валюты (корон), данные пригласившего пользователя.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID пользователя (ObjectId)' })
  @ApiResponse({ status: 200, description: 'Статистика пользователя успешно получена' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUserStatistics(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.getUserStatistics(id);
  }

  @Post(':id/balance')
  @ApiOperation({
    summary: 'Изменить баланс пользователя',
    description: 'Начисляет или списывает внутриигровую валюту (короны) пользователю. Положительное число - начисление, отрицательное - списание. Транзакция сохраняется в истории для отслеживания.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID пользователя (ObjectId)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Сумма изменения. Положительное - начисление, отрицательное - списание',
          example: 100,
        },
        description: {
          type: 'string',
          description: 'Описание транзакции (для истории)',
          example: 'Подарок за регистрацию',
        },
        adminId: {
          type: 'string',
          description: 'ID администратора, который выполняет операцию (опционально)',
        },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Баланс успешно изменен. Возвращает пользователя и новый баланс.',
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID или неверные данные запроса' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async updateBalance(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateBalanceDto: UpdateBalanceDto,
    @Body('adminId') adminId?: string,
  ) {
    return this.usersService.updateUserBalance(id, updateBalanceDto, adminId);
  }
}
