import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateBalanceDto {
  @ApiProperty({
    description: 'Сумма изменения баланса. Положительное число - начисление, отрицательное - списание',
    example: 100,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  amount: number; // Положительное для начисления, отрицательное для списания

  @ApiProperty({
    description: 'Описание транзакции (для истории)',
    example: 'Подарок за регистрацию',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

