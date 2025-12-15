import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUserDto {
  @ApiProperty({
    description: 'Поисковый запрос: Telegram ID (число) или username пользователя',
    example: '123456789',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  query: string; // ID или username
}

