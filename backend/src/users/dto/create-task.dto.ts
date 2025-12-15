import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsUrl, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../schemas/task.schema';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Название задания',
    example: 'Сделать репост в Instagram',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Описание задания',
    example: 'Сделайте репост нашей публикации в Instagram и получите награду',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Сумма вознаграждения в коронах',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  reward: number;

  @ApiProperty({
    description: 'Тип задания',
    enum: TaskType,
    example: TaskType.MANUAL,
  })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({
    description: 'Ссылка на задание (опционально)',
    example: 'https://instagram.com/p/example',
    required: false,
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  link?: string;
}

