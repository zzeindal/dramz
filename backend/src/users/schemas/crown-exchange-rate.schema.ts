import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CrownExchangeRateDocument = CrownExchangeRate & Document;

@Schema({ timestamps: true })
export class CrownExchangeRate {
  @Prop({ required: true, default: 1 })
  rubPerCrown: number; // 1 корона = X рублей

  @Prop({ required: true, default: 0.01 })
  usdPerCrown: number; // 1 корона = X USD

  @Prop({ required: true, default: 1 })
  telegramStarPerCrown: number; // 1 корона = X telegram stars

  @Prop({ default: true })
  isActive: boolean; // Активный курс

  @Prop()
  changedBy?: string; // Кто изменил курс (admin username)
}

export const CrownExchangeRateSchema = SchemaFactory.createForClass(CrownExchangeRate);

// Индекс для активного курса (должен быть только один активный)
CrownExchangeRateSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

