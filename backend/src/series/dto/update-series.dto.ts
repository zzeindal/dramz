import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSeriesDto {
  @ApiProperty({
    description: 'Название сериала',
    example: 'Интересный сериал',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Описание сериала',
    example: 'Очень интересный сериал с захватывающим сюжетом',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Цена сериала в коронах',
    example: 150,
    minimum: 0,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Видимость сериала в мини-приложении',
    example: true,
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiProperty({
    description: 'Количество бесплатных эпизодов (первые N эпизодов будут доступны без покупки сериала)',
    example: 2,
    minimum: 0,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  freeEpisodesCount?: number;
}

