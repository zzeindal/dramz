import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ViewDocument = View & Document;

@Schema({ timestamps: true })
export class View {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Series', required: true })
  seriesId: Types.ObjectId;

  @Prop({ required: true })
  episodeNumber: number; // Номер серии

  @Prop({ required: true, default: Date.now })
  viewedAt: Date;
}

export const ViewSchema = SchemaFactory.createForClass(View);

