import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskType {
  MANUAL = 'manual', // Ручная модерация - пользователь нажимает "Выполнить"
  LIKE_SERIES = 'like_series', // Автоматическое: лайкнуть серию
  WATCH_SERIES = 'watch_series', // Автоматическое: посмотреть серию
  INVITE_REFERRAL = 'invite_referral', // Автоматическое: пригласить по реф ссылке
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string; // Название задания

  @Prop({ required: true })
  description: string; // Описание задания

  @Prop({ required: true })
  reward: number; // Сумма вознаграждения в коронах

  @Prop({ required: true, enum: TaskType })
  type: TaskType; // Тип задания

  @Prop()
  link?: string; // Ссылка (опционально)

  @Prop({ required: true, default: true })
  isActive: boolean; // Активно ли задание

  @Prop()
  createdBy?: string; // ID админа, который создал задание
}

export const TaskSchema = SchemaFactory.createForClass(Task);

