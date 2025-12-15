import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FreeSeriesViewDocument = FreeSeriesView & Document;

@Schema({ timestamps: true })
export class FreeSeriesView {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Series', required: true })
  seriesId: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  grantedAt: Date;

  @Prop({ required: true, default: false })
  isUsed: boolean; // Использован ли бесплатный просмотр

  @Prop()
  usedAt?: Date; // Когда был использован
}

export const FreeSeriesViewSchema = SchemaFactory.createForClass(FreeSeriesView);

