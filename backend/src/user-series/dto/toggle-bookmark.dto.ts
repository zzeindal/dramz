import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ToggleBookmarkDto {
  @ApiProperty({
    description: 'Telegram ID пользователя',
    example: 123456789,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  telegramId: number;
}

