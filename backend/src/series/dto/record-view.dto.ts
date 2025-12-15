import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class RecordViewDto {
  @ApiProperty({
    description: 'Telegram ID пользователя',
    example: 123456789,
  })
  @IsNumber()
  telegramId: number;
}

