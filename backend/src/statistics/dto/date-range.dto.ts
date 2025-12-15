import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty({
    description: 'Начальная дата периода (формат: YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
    type: String,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Конечная дата периода (формат: YYYY-MM-DD)',
    example: '2024-12-31',
    required: false,
    type: String,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

