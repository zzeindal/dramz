import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PurchaseDocument = Purchase & Document;

@Schema({ timestamps: true })
export class Purchase {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Series', required: true })
  seriesId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Сумма покупки в коронах

  @Prop({ required: true, default: Date.now })
  purchasedAt: Date;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);

