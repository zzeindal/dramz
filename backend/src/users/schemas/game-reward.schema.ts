import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GameRewardDocument = GameReward & Document;

export enum RewardType {
  SMALL = 'SMALL', // 20 корон (70%)
  MEDIUM = 'MEDIUM', // 35 корон (24.5%)
  LARGE = 'LARGE', // 45 корон (4.5%)
  SUPER_RARE = 'SUPER_RARE', // Бесплатный просмотр сериала (1%)
}

@Schema({ timestamps: true })
export class GameReward {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: RewardType })
  rewardType: RewardType;

  @Prop()
  crownsAmount?: number; // Количество корон (если приз - короны)

  @Prop({ type: Types.ObjectId, ref: 'Series' })
  seriesId?: Types.ObjectId; // ID сериала (если приз - бесплатный просмотр)

  @Prop({ required: true, default: Date.now })
  rewardedAt: Date;
}

export const GameRewardSchema = SchemaFactory.createForClass(GameReward);

