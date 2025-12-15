import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FaqDocument = Faq & Document;

@Schema({ timestamps: true })
export class Faq {
  @Prop({ required: true })
  question: string; // Вопрос

  @Prop({ required: true })
  answer: string; // Ответ

  @Prop({ required: true, default: 0 })
  order: number; // Порядок отображения (для сортировки)

  @Prop({ required: true, default: true })
  isVisible: boolean; // Видимость в пользовательском интерфейсе
}

export const FaqSchema = SchemaFactory.createForClass(Faq);

