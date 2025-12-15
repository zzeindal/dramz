import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReferralLink, ReferralLinkSchema } from './referral.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  telegramId: number;

  @Prop()
  username?: string;

  @Prop()
  displayName?: string; // Отображаемое имя пользователя

  @Prop()
  image?: string;

  @Prop({ required: true, default: 0 })
  crowns: number; // Внутриигровая валюта

  @Prop({ type: Types.ObjectId, ref: 'User' })
  referredBy?: Types.ObjectId; // Кто пригласил

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  referrals: Types.ObjectId[]; // Список рефералов

  @Prop()
  lastActivityAt?: Date;

  @Prop({ required: true, default: Date.now })
  registeredAt: Date;

  @Prop()
  accessToken?: string; // JWT токен для аутентификации

  @Prop({ type: [ReferralLinkSchema] })
  referralLinks: ReferralLink[];
}

export const UserSchema = SchemaFactory.createForClass(User);

