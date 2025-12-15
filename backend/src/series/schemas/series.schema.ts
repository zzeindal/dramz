import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SeriesDocument = Series & Document;

export enum AudioLanguage {
  RUSSIAN = 'russian',
  ENGLISH = 'english',
}

export enum SubtitleLanguage {
  RUSSIAN = 'russian',
  ENGLISH = 'english',
  PORTUGUESE = 'portuguese',
  HINDI = 'hindi',
  TURKISH = 'turkish',
  NONE = 'none',
}

export interface EpisodeMedia {
  audioLanguage: AudioLanguage;
  subtitleLanguage: SubtitleLanguage;
  videoUrl: string;
  filePath?: string;
}

export interface EpisodeData {
  episodeNumber: number;
  title?: string;
  description?: string;
  media: EpisodeMedia[];
  isComplete: boolean; // Все комбинации озвучка+субтитры загружены
}

@Schema({ timestamps: true })
export class Series {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  coverImage: string; // Путь к обложке

  @Prop({ required: true, default: 0 })
  price: number; // Цена в коронах

  @Prop({ required: true, default: false })
  isVisible: boolean; // Видимость в мини-аппе

  @Prop({ required: true, default: 0 })
  freeEpisodesCount: number; // Количество бесплатных эпизодов (первые N эпизодов доступны без покупки)

  @Prop({ 
    type: [{
      episodeNumber: Number,
      title: String,
      description: String,
      media: [{
        audioLanguage: String,
        subtitleLanguage: String,
        videoUrl: String,
        filePath: String,
      }],
      isComplete: Boolean,
    }], 
    default: [] 
  })
  episodes: EpisodeData[];
}

export const SeriesSchema = SchemaFactory.createForClass(Series);

