import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true, unique: true })
  username: string; // Логин админа

  @Prop({ required: true })
  password: string; // Хешированный пароль

  @Prop({ default: true })
  isActive: boolean; // Активен ли админ

  @Prop()
  lastLoginAt?: Date; // Дата последнего входа
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// Хешируем пароль перед сохранением
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Метод для проверки пароля
AdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Расширяем интерфейс для TypeScript
declare module 'mongoose' {
  interface Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
  }
}

