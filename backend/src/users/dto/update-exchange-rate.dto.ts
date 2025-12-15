import { IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateExchangeRateDto {
  @ApiProperty({
    description: 'Курс: сколько рублей за 1 корону',
    example: 1,
    minimum: 0.01,
    type: Number,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  rubPerCrown?: number;

  @ApiProperty({
    description: 'Курс: сколько USD за 1 корону',
    example: 0.01,
    minimum: 0.0001,
    type: Number,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  @IsOptional()
  usdPerCrown?: number;

  @ApiProperty({
    description: 'Курс: сколько Telegram Stars за 1 корону',
    example: 1,
    minimum: 0.01,
    type: Number,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  telegramStarPerCrown?: number;
}

