import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CompletionStatus } from '../schemas/task-completion.schema';

export class ModerateTaskDto {
  @ApiProperty({
    description: 'Статус модерации',
    enum: CompletionStatus,
    example: CompletionStatus.COMPLETED,
  })
  @IsEnum(CompletionStatus)
  status: CompletionStatus;

  @ApiProperty({
    description: 'Заметка модератора (опционально)',
    example: 'Задание выполнено корректно',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}

