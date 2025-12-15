import { ApiProperty } from '@nestjs/swagger';
import { AudioLanguage, SubtitleLanguage } from '../schemas/series.schema';

export class MediaCombinationDto {
  @ApiProperty({ enum: AudioLanguage })
  audio: AudioLanguage;

  @ApiProperty({ enum: SubtitleLanguage })
  subtitle: SubtitleLanguage;
}

export class EpisodeProgressResponseDto {
  @ApiProperty({
    description: 'Загруженные комбинации',
    type: [MediaCombinationDto],
  })
  uploaded: MediaCombinationDto[];

  @ApiProperty({
    description: 'Оставшиеся комбинации для загрузки',
    type: [MediaCombinationDto],
  })
  remaining: MediaCombinationDto[];

  @ApiProperty({
    description: 'Все ли комбинации загружены',
    example: false,
  })
  isComplete: boolean;
}

