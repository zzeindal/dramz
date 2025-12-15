import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteTaskDto {
  @ApiProperty({
    description: 'Ссылка на доказательство выполнения задания (например, ссылка на репост из Instagram)',
    example: 'https://instagram.com/p/example',
  })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  link: string;
}

