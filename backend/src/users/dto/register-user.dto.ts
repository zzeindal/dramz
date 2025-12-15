import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterUserDto {
  @ApiProperty({
    description: 'Telegram ID пользователя',
    example: 123456789,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  telegramId: number;

  @ApiProperty({
    description: 'Username пользователя',
    example: 'username',
    required: false,
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: 'Отображаемое имя пользователя',
    example: 'Имя Фамилия',
    required: false,
  })
  @IsString()
  @IsOptional()
  displayName?: string;
}

