import { IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PaymentCurrency {
  RUB = 'RUB',
  USD = 'USD',
  TELEGRAM_STAR = 'TELEGRAM_STAR',
}

export class PurchaseCrownsDto {
  @ApiProperty({
    description: 'Сумма платежа',
    example: 10.5,
    minimum: 0.01,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Валюта платежа',
    enum: PaymentCurrency,
    example: PaymentCurrency.USD,
  })
  @IsEnum(PaymentCurrency)
  @IsNotEmpty()
  currency: PaymentCurrency;

  @ApiProperty({
    description: 'Хеш транзакции (опционально)',
    example: '0x1234567890abcdef...',
    required: false,
  })
  @IsOptional()
  transactionHash?: string;
}

