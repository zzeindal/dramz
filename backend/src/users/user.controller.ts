import { Controller, Get, Post, Body, Query, Param, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UserService } from './user.service';
import { UsersService } from './users.service';
import { ExchangeRateService } from './exchange-rate.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { PurchaseCrownsDto } from './dto/purchase-crowns.dto';
import { GetTokenDto } from './dto/get-token.dto';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TelegramAuthService } from './telegram-auth.service';
import { SseAuthService } from './sse-auth.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly usersService: UsersService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly telegramAuthService: TelegramAuthService,
    private readonly sseAuthService: SseAuthService,
  ) {}

  @Get('sse/:sessionId')
  @ApiOperation({
    summary: 'Подключиться к SSE для получения токена авторизации',
    description: 'Устанавливает Server-Sent Events соединение для получения access-token после авторизации в Telegram боте. ' +
      'Используется для автоматического входа на сайте после авторизации в боте. ' +
      'Соединение остается открытым до получения токена или истечения таймаута (5 минут).',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Уникальный идентификатор сессии, полученный от эндпоинта /user/session',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE соединение установлено. События будут отправляться в формате Server-Sent Events.',
    headers: {
      'Content-Type': { description: 'text/event-stream' },
      'Cache-Control': { description: 'no-cache' },
      'Connection': { description: 'keep-alive' },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный sessionId' })
  connectSSE(@Param('sessionId') sessionId: string, @Res({ passthrough: false }) response: Response) {
    this.sseAuthService.registerClient(sessionId, response);
    // Не возвращаем значение, так как используем passthrough: false
  }

  @Get('session')
  @ApiOperation({
    summary: 'Получить новый sessionId для SSE соединения',
    description: 'Генерирует уникальный sessionId, который используется для установки SSE соединения. ' +
      'Этот sessionId должен быть передан в Telegram бот, который затем использует его при запросе токена.',
  })
  @ApiResponse({
    status: 200,
    description: 'SessionId успешно сгенерирован',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Уникальный идентификатор сессии' },
        sseUrl: { type: 'string', description: 'URL для подключения к SSE', example: '/user/sse/{sessionId}' },
      },
    },
  })
  async getSession() {
    const sessionId = this.sseAuthService.generateSessionId();
    return {
      sessionId,
      sseUrl: `/user/sse/${sessionId}`,
    };
  }

  @Post('token')
  @ApiOperation({
    summary: 'Получить access-token по Telegram initData',
    description: 'Безопасно выдает access-token для пользователя после проверки подписи Telegram initData. ' +
      'Поддерживает два формата:\n' +
      '1. Web App initData (от Telegram Mini App через window.Telegram.WebApp.initData)\n' +
      '2. Данные от бота (когда пользователь заходит через веб-ссылку и пишет /start, бот отправляет initData)\n\n' +
      'Если указан sessionId, токен будет отправлен через SSE соединение вместо прямого ответа.',
  })
  @ApiBody({ type: GetTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Access-token успешно выдан (или отправлен через SSE, если указан sessionId)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: 'Успешно ли обработан запрос' },
        message: { type: 'string', description: 'Сообщение о результате' },
        accessToken: { type: 'string', description: 'JWT токен для аутентификации (только если sessionId не указан)' },
        user: {
          type: 'object',
          properties: {
            telegramId: { type: 'number' },
            username: { type: 'string' },
            displayName: { type: 'string' },
            crowns: { type: 'number' },
          },
        },
        sentViaSSE: { type: 'boolean', description: 'Был ли токен отправлен через SSE' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный формат initData или отсутствует токен бота' })
  @ApiResponse({ status: 401, description: 'Невалидная подпись initData или данные устарели' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден (будет создан автоматически)' })
  async getToken(@Body() getTokenDto: GetTokenDto) {
    // Проверяем подпись Telegram initData
    const userData = this.telegramAuthService.validateInitData(getTokenDto.initData);
    
    if (!userData) {
      throw new Error('Failed to validate initData');
    }

    // Получаем или создаем пользователя
    let user;
    try {
      user = await this.userService.getAccessTokenByTelegramId(userData.telegramId);
    } catch (error) {
      // Если пользователь не найден, регистрируем его
      const registerResult = await this.userService.registerUser({
        telegramId: userData.telegramId,
        username: userData.username,
        displayName: userData.firstName || userData.lastName 
          ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
          : undefined,
        referralCode: getTokenDto.referralCode,
      });
      user = {
        accessToken: registerResult.accessToken,
        user: registerResult.user,
      };
    }

    // Если указан sessionId, отправляем токен через SSE
    if (getTokenDto.sessionId) {
      const sent = this.sseAuthService.sendToken(getTokenDto.sessionId, user);
      if (sent) {
        return {
          success: true,
          message: 'Token sent via SSE',
          sentViaSSE: true,
        };
      } else {
        // Если SSE соединение не найдено, возвращаем токен напрямую
        return {
          success: true,
          message: 'SSE connection not found, returning token directly',
          ...user,
          sentViaSSE: false,
        };
      }
    }

    // Если sessionId не указан, возвращаем токен напрямую (обычный режим)
    return {
      success: true,
      message: 'Token generated successfully',
      ...user,
      sentViaSSE: false,
    };
  }

  @Get('balance')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить баланс пользователя',
    description: 'Возвращает текущий баланс корон пользователя. Требует access-token в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Баланс пользователя',
    schema: {
      type: 'object',
      properties: {
        telegramId: { type: 'number', description: 'Telegram ID пользователя' },
        crowns: { type: 'number', description: 'Текущий баланс корон' },
        username: { type: 'string', description: 'Username пользователя' },
        displayName: { type: 'string', description: 'Отображаемое имя' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getBalance(@CurrentUser() user: any) {
    return this.userService.getUserBalance(user.telegramId);
  }

  @Get('profile')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить профиль пользователя',
    description: 'Возвращает полную информацию о профиле пользователя: баланс, активность, статистику. Требует access-token в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    schema: {
      type: 'object',
      properties: {
        telegramId: { type: 'number' },
        username: { type: 'string' },
        displayName: { type: 'string' },
        crowns: { type: 'number', description: 'Баланс корон' },
        registeredAt: { type: 'string', format: 'date-time' },
        lastActivityAt: { type: 'string', format: 'date-time' },
        totalPurchases: { type: 'number', description: 'Количество покупок' },
        totalSpent: { type: 'number', description: 'Всего потрачено корон' },
        totalViews: { type: 'number', description: 'Количество просмотров' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getProfile(@CurrentUser() user: any) {
    return this.userService.getUserProfile(user.telegramId);
  }

  @Get('referrals')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить реферальную информацию пользователя',
    description: 'Возвращает реферальные ссылки пользователя, информацию о том, кто его пригласил, и список его рефералов. Требует access-token в заголовке Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Реферальная информация',
    schema: {
      type: 'object',
      properties: {
        referralLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['youtube', 'telegram', 'instagram', 'x'] },
              code: { type: 'string' },
              activatedCount: { type: 'number' },
            },
          },
        },
        referrer: {
          type: 'object',
          nullable: true,
          properties: {
            name: { type: 'string' },
            image: { type: 'string', nullable: true },
            username: { type: 'string', nullable: true },
          },
        },
        referrals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              image: { type: 'string', nullable: true },
              username: { type: 'string', nullable: true },
              referredAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getReferrals(@CurrentUser() user: any) {
    return this.userService.getReferrals(user.telegramId);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Зарегистрировать нового пользователя',
    description: 'Создает нового пользователя в системе. Если пользователь уже существует, возвращает существующего.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        telegramId: {
          type: 'number',
          description: 'Telegram ID пользователя',
          example: 123456789,
        },
        username: {
          type: 'string',
          description: 'Username пользователя (опционально)',
          example: 'username',
        },
        displayName: {
          type: 'string',
          description: 'Отображаемое имя пользователя (опционально)',
          example: 'Имя Фамилия',
        },
      },
      required: ['telegramId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован или уже существует',
  })
  async register(@Body() registerDto: RegisterUserDto) {
    return this.userService.registerUser(registerDto);
  }

  @Get('crowns/exchange-rate')
  @ApiOperation({
    summary: 'Получить текущий курс корон',
    description: 'Возвращает текущий активный курс обмена корон на рубли, USD и Telegram Stars. Публичный endpoint, не требует авторизации.',
  })
  @ApiResponse({
    status: 200,
    description: 'Текущий курс корон',
    schema: {
      type: 'object',
      properties: {
        rubPerCrown: { type: 'number', description: '1 корона = X рублей', example: 1 },
        usdPerCrown: { type: 'number', description: '1 корона = X USD', example: 0.01 },
        telegramStarPerCrown: { type: 'number', description: '1 корона = X Telegram Stars', example: 1 },
      },
    },
  })
  async getExchangeRate() {
    const rate = await this.exchangeRateService.getCurrentRate();
    return {
      rubPerCrown: rate.rubPerCrown,
      usdPerCrown: rate.usdPerCrown,
      telegramStarPerCrown: rate.telegramStarPerCrown,
    };
  }

  @Post('crowns/purchase')
  @UseGuards(UserJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Купить короны',
    description: 'Покупка корон за RUB, USD или Telegram Stars. Использует текущий курс из базы данных. Создает запись о покупке, начисляет короны пользователю и создает транзакцию. Требует access-token в заголовке Authorization.',
  })
  @ApiBody({
    type: PurchaseCrownsDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Короны успешно куплены',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        user: { type: 'object', description: 'Обновленный пользователь' },
        crownsAdded: { type: 'number', description: 'Количество начисленных корон' },
        amount: { type: 'number', description: 'Сумма платежа' },
        currency: { type: 'string', description: 'Валюта платежа (RUB, USD, TELEGRAM_STAR)' },
        purchase: { type: 'object', description: 'Запись о покупке' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async purchaseCrowns(
    @CurrentUser() user: any,
    @Body() purchaseCrownsDto: PurchaseCrownsDto,
  ) {
    return this.usersService.purchaseCrowns(user.telegramId, purchaseCrownsDto);
  }
}

