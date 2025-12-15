import { IsString, IsOptional, IsNumber, IsEnum, IsUrl, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../schemas/task.schema';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Название задания',
    example: 'Сделать репост в Instagram',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Описание задания',
    example: 'Сделайте репост нашей публикации в Instagram и получите награду',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Сумма вознаграждения в коронах',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reward?: number;

  @ApiProperty({
    description: 'Тип задания',
    enum: TaskType,
    example: TaskType.MANUAL,
    required: false,
  })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiProperty({
    description: 'Ссылка на задание',
    example: 'https://instagram.com/p/example',
    required: false,
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  link?: string;

  @ApiProperty({
    description: 'Активно ли задание',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

