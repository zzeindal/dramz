import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateFaqDto {
  @ApiProperty({
    description: 'Вопрос',
    example: 'Как купить сериал?',
    required: false,
  })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty({
    description: 'Ответ',
    example: 'Для покупки сериала необходимо иметь достаточное количество корон на балансе.',
    required: false,
  })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiProperty({
    description: 'Порядок отображения (для сортировки)',
    example: 1,
    minimum: 0,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'Видимость в пользовательском интерфейсе',
    example: true,
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}

