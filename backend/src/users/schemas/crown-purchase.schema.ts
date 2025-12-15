import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CrownPurchaseDocument = CrownPurchase & Document;

@Schema({ timestamps: true })
export class CrownPurchase {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Сумма платежа

  @Prop({ required: true })
  currency: string; // Валюта платежа (RUB, USD, TELEGRAM_STAR)

  @Prop({ required: true })
  crownsAmount: number; // Количество купленных корон

  @Prop({ required: true })
  exchangeRate: number; // Курс обмена (сколько единиц валюты за 1 корону)

  @Prop()
  transactionHash?: string; // Хеш транзакции USDT (если есть)

  @Prop({ required: true, default: Date.now })
  purchasedAt: Date;
}

export const CrownPurchaseSchema = SchemaFactory.createForClass(CrownPurchase);

