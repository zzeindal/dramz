import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AudioLanguage, SubtitleLanguage } from '../schemas/series.schema';

export class UploadEpisodeMediaDto {
  @ApiProperty({
    description: 'Номер серии для загрузки',
    example: 1,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  episodeNumber: number;

  @ApiProperty({
    description: 'Язык озвучки',
    enum: AudioLanguage,
    example: AudioLanguage.RUSSIAN,
  })
  @IsEnum(AudioLanguage)
  @IsNotEmpty()
  audioLanguage: AudioLanguage;

  @ApiProperty({
    description: 'Язык субтитров',
    enum: SubtitleLanguage,
    example: SubtitleLanguage.RUSSIAN,
  })
  @IsEnum(SubtitleLanguage)
  @IsNotEmpty()
  subtitleLanguage: SubtitleLanguage;
}

