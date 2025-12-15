import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskCompletionDocument = TaskCompletion & Document;

export enum CompletionStatus {
  PENDING = 'pending', // Ожидает модерации (для ручных заданий)
  COMPLETED = 'completed', // Выполнено и награда выдана
  REJECTED = 'rejected', // Отклонено модератором
}

@Schema({ timestamps: true })
export class TaskCompletion {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({ required: true, enum: CompletionStatus, default: CompletionStatus.PENDING })
  status: CompletionStatus;

  @Prop()
  completedAt?: Date; // Когда задание было выполнено пользователем

  @Prop()
  rewardedAt?: Date; // Когда была выдана награда

  @Prop({ type: Types.ObjectId, ref: 'User' })
  moderatedBy?: Types.ObjectId; // ID админа, который проверил задание

  @Prop()
  moderationNote?: string; // Заметка модератора

  @Prop()
  proofLink?: string; // Ссылка на доказательство выполнения (для ручных заданий)

  // Для автоматических заданий - дополнительные данные
  @Prop({ type: Types.ObjectId, ref: 'Series' })
  seriesId?: Types.ObjectId; // Для заданий типа LIKE_SERIES или WATCH_SERIES

  @Prop({ type: Types.ObjectId, ref: 'User' })
  referredUserId?: Types.ObjectId; // Для заданий типа INVITE_REFERRAL
}

export const TaskCompletionSchema = SchemaFactory.createForClass(TaskCompletion);

// Индекс для быстрого поиска последнего выполнения задания пользователем
TaskCompletionSchema.index({ userId: 1, taskId: 1, completedAt: -1 });

