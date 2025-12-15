import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookmarkDocument = Bookmark & Document;

@Schema({ timestamps: true })
export class Bookmark {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Series', required: true })
  seriesId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

// Индекс для уникальности (один пользователь может сохранить сериал только один раз)
BookmarkSchema.index({ userId: 1, seriesId: 1 }, { unique: true });

