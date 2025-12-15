import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BalanceTransactionDocument = BalanceTransaction & Document;

export enum TransactionType {
  ADMIN_ADD = 'admin_add',
  ADMIN_SUBTRACT = 'admin_subtract',
  PURCHASE = 'purchase', // Покупка сериала за короны
  USDT_PURCHASE = 'usdt_purchase', // Покупка корон за USDT
  REFERRAL = 'referral',
  GAME_REWARD = 'game_reward', // Награда за игру
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class BalanceTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Положительное для начисления, отрицательное для списания

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  adminId?: Types.ObjectId; // ID админа, который сделал транзакцию
}

export const BalanceTransactionSchema = SchemaFactory.createForClass(BalanceTransaction);

