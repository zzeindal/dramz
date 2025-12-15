import { IsString, IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSeriesDto {
  @ApiProperty({
    description: 'Название сериала',
    example: 'Интересный сериал',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Описание сериала',
    example: 'Очень интересный сериал с захватывающим сюжетом',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Цена сериала в коронах (внутриигровая валюта)',
    example: 100,
    minimum: 0,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Количество бесплатных эпизодов (первые N эпизодов будут доступны без покупки сериала)',
    example: 2,
    minimum: 0,
    default: 0,
    type: Number,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  freeEpisodesCount?: number;
}

