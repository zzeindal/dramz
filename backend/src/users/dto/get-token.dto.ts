import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetTokenDto {
  @ApiProperty({
    description: 'Telegram initData - строка с данными пользователя, подписанная Telegram. Может быть получена из:\n' +
      '1. Web App: window.Telegram.WebApp.initData\n' +
      '2. Бот через веб-ссылку: данные от бота при команде /start\n' +
      'Формат: query_id=...&user=...&hash=... (Web App) или user=...&hash=... (бот)',
    example: 'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22ru%22%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  initData: string;

  @ApiProperty({
    description: 'Реферальный код',
    example: 'K2M9A3F7',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({
    description: 'Session ID для SSE соединения. Используется для автоматической отправки токена на сайт через Server-Sent Events. Если указан, токен будет отправлен через SSE вместо прямого ответа.',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

