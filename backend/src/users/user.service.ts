import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
const crypto = require('crypto');
import { User, UserDocument } from './schemas/user.schema';
import { Purchase, PurchaseDocument } from './schemas/purchase.schema';
import { View, ViewDocument } from './schemas/view.schema';
import { Referral, ReferralDocument, ReferralLinkType } from './schemas/referral.schema';
import { TaskService } from './task.service';
import { TaskType } from './schemas/task.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(View.name) private viewModel: Model<ViewDocument>,
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    private jwtService: JwtService,
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService,
  ) {}

  generateCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${timestamp.slice(-4)}${random}`.substring(0, 8);
  }

  async getUserBalance(telegramId: number) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    return {
      telegramId: user.telegramId,
      crowns: user.crowns,
      username: user.username,
      displayName: user.displayName,
    };
  }

  async getUserProfile(telegramId: number) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    // Получаем статистику покупок
    const purchases = await this.purchaseModel.find({ userId: user._id }).exec();
    const totalPurchases = purchases.length;
    const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

    // Получаем статистику просмотров
    const totalViews = await this.viewModel.countDocuments({ userId: user._id }).exec();

    return {
      telegramId: user.telegramId,
      username: user.username,
      displayName: user.displayName,
      crowns: user.crowns,
      registeredAt: user.registeredAt,
      lastActivityAt: user.lastActivityAt,
      totalPurchases,
      totalSpent,
      totalViews,
    };
  }

  async registerUser(data: { telegramId: number; username?: string; displayName?: string, referralCode?: string }): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
    user: {
      telegramId: number;
      username?: string;
      displayName?: string;
      crowns: number;
      registeredAt: Date;
    };
  }> {
    // Проверяем, существует ли пользователь
    let user = await this.userModel.findOne({ telegramId: data.telegramId }).exec();
    let isNewUser = false;

    if (user) {
      // Обновляем данные, если они изменились
      if (data.username !== undefined) {
        user.username = data.username;
      }
      if (data.displayName !== undefined) {
        user.displayName = data.displayName;
      }
      user.lastActivityAt = new Date();
      
      // Если у пользователя нет токена, генерируем новый
      if (!user.accessToken) {
        isNewUser = true;
      }
    } else {
      // Создаем нового пользователя
      user = new this.userModel({
        telegramId: data.telegramId,
        username: data.username,
        displayName: data.displayName,
        crowns: 0,
        registeredAt: new Date(),
        lastActivityAt: new Date(),
        referralLinks: [
          {
            type: ReferralLinkType.YOUTUBE,
            code: this.generateCode(),
          },
          {
            type: ReferralLinkType.TELEGRAM,
            code: this.generateCode(),
          },
          {
            type: ReferralLinkType.INSTAGRAM,
            code: this.generateCode(),
          },
          {
            type: ReferralLinkType.X,
            code: this.generateCode(),
          },
        ],
      });

      if(data.referralCode) {
        const referral = await this.userModel.findOne({ referralLinks: { $elemMatch: { code: data.referralCode } } }).exec();
        if(referral && referral._id) {
          let newReferral = new this.referralModel({
            user: user._id,
            referral: referral._id as Types.ObjectId,
            activatedLink: referral.referralLinks.find(link => link.code === data.referralCode),
          });
          await newReferral.save();

          referral.referralLinks.find(link => link.code === data.referralCode).activatedCount++;
          await referral.save();

          // Проверяем автоматические задания на приглашение по реф ссылке
          try {
            const referredUserId: Types.ObjectId = user._id as Types.ObjectId;
            await this.taskService.checkAndRewardAutomaticTask(
              referral._id as Types.ObjectId,
              TaskType.INVITE_REFERRAL,
              { referredUserId },
            );
          } catch (error) {
            // Игнорируем ошибки при проверке заданий
            console.error('Error checking automatic task for referral:', error);
          }
        }
      }
      isNewUser = true;
    }

    // Генерируем токен
    const payload = { telegramId: user.telegramId, sub: user._id.toString() };
    const accessToken = this.jwtService.sign(payload);
    user.accessToken = accessToken;
    await user.save();

    return {
      success: true,
      message: isNewUser ? 'User registered successfully' : 'User already exists, updated',
      accessToken,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        displayName: user.displayName,
        crowns: user.crowns,
        registeredAt: user.registeredAt,
      },
    };
  }

  async getAccessTokenByTelegramId(telegramId: number): Promise<{
    accessToken: string;
    user: {
      telegramId: number;
      username?: string;
      displayName?: string;
      crowns: number;
    };
  }> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    // Если у пользователя уже есть токен, возвращаем его
    if (user.accessToken) {
      return {
        accessToken: user.accessToken,
        user: {
          telegramId: user.telegramId,
          username: user.username,
          displayName: user.displayName,
          crowns: user.crowns,
        },
      };
    }

    // Генерируем новый токен
    const payload = { telegramId: user.telegramId, sub: user._id.toString() };
    const accessToken = this.jwtService.sign(payload);
    user.accessToken = accessToken;
    await user.save();

    return {
      accessToken,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        displayName: user.displayName,
        crowns: user.crowns,
      },
    };
  }

  async updateUserActivity(telegramId: number) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (user) {
      user.lastActivityAt = new Date();
      await user.save();
    }
  }

  async getReferrals(telegramId: number) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const referralLinks = user.referralLinks.map(link => ({
      type: link.type,
      code: link.code,
      activatedCount: link.activatedCount,
    }))

    const referrerInfo = await this.referralModel
      .findOne({ user: user._id })
      .populate('referral', 'username displayName image telegramId')
      .exec()

    const referrals = await this.referralModel
      .find({ referral: user._id })
      .populate('user', 'username displayName image telegramId')
      .exec()

    return {
      referralLinks,
      referrer: referrerInfo && referrerInfo.referral && typeof referrerInfo.referral === 'object' ? {
        name: (referrerInfo.referral as any).displayName || (referrerInfo.referral as any).username || 'Unknown',
        image: (referrerInfo.referral as any).image || null,
        username: (referrerInfo.referral as any).username || null,
      } : null,
      referrals: referrals.map(ref => {
        const referredUser = ref.user && typeof ref.user === 'object' ? ref.user as any : null
        return {
          name: referredUser?.displayName || referredUser?.username || 'Unknown',
          image: referredUser?.image || null,
          username: referredUser?.username || null,
          referredAt: ref.referredAt,
        }
      }),
    }
  }
}

