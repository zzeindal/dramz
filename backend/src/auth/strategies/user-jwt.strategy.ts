import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findOne({ 
      telegramId: payload.telegramId,
    }).exec();
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Проверяем, что токен из заголовка совпадает с сохраненным токеном
    // Это делается через проверку подписи JWT, но для дополнительной безопасности
    // можно проверить, что токен в БД совпадает (опционально)
    
    // Обновляем активность пользователя
    user.lastActivityAt = new Date();
    await user.save();

    return { 
      telegramId: user.telegramId,
      userId: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
    };
  }
}

