import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFaqDto {
  @ApiProperty({
    description: 'Вопрос',
    example: 'Как купить сериал?',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Ответ',
    example: 'Для покупки сериала необходимо иметь достаточное количество корон на балансе. Затем нажмите кнопку "Купить" на странице сериала.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({
    description: 'Порядок отображения (для сортировки)',
    example: 1,
    minimum: 0,
    default: 0,
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
    default: true,
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}

