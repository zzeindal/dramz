import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Purchase, PurchaseDocument } from './schemas/purchase.schema';
import { CrownPurchase, CrownPurchaseDocument } from './schemas/crown-purchase.schema';
import { View, ViewDocument } from './schemas/view.schema';
import { BalanceTransaction, BalanceTransactionDocument, TransactionType } from './schemas/balance-transaction.schema';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { PurchaseCrownsDto, PaymentCurrency } from './dto/purchase-crowns.dto';
import { ExchangeRateService } from './exchange-rate.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(CrownPurchase.name) private crownPurchaseModel: Model<CrownPurchaseDocument>,
    @InjectModel(View.name) private viewModel: Model<ViewDocument>,
    @InjectModel(BalanceTransaction.name) private balanceTransactionModel: Model<BalanceTransactionDocument>,
    private exchangeRateService: ExchangeRateService,
  ) {}

  async searchUser(query: string): Promise<UserDocument | null> {
    // Пробуем найти по ID (число)
    const telegramId = parseInt(query, 10);
    if (!isNaN(telegramId)) {
      return this.userModel.findOne({ telegramId }).exec();
    }

    // Ищем по username
    return this.userModel.findOne({ username: query }).exec();
  }

  async findUserById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async getUserData(userId: string) {
    const user = await this.findUserById(userId);
    
    const purchases = await this.purchaseModel.find({ userId: new Types.ObjectId(userId) }).populate('seriesId').exec();
    const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

    const referredBy = user.referredBy 
      ? await this.userModel.findById(user.referredBy).select('telegramId username displayName').exec()
      : null;

    const referrals = await this.userModel.find({ _id: { $in: user.referrals } })
      .select('telegramId username displayName registeredAt').exec();

    return {
      user: {
        _id: user._id.toString(),
        telegramId: user.telegramId,
        username: user.username,
        displayName: user.displayName,
        crowns: user.crowns,
        registeredAt: user.registeredAt,
        lastActivityAt: user.lastActivityAt,
      },
      purchases: purchases.map(p => ({
        seriesId: p.seriesId,
        amount: p.amount,
        purchasedAt: p.purchasedAt,
      })),
      totalSpent,
      referredBy,
      referrals,
    };
  }

  async updateUserBalance(
    userId: string,
    updateBalanceDto: UpdateBalanceDto,
    adminId?: string,
  ): Promise<{ user: UserDocument; newBalance: number }> {
    const user = await this.findUserById(userId);

    const transaction = new this.balanceTransactionModel({
      userId: new Types.ObjectId(userId),
      amount: updateBalanceDto.amount,
      type: updateBalanceDto.amount > 0 ? TransactionType.ADMIN_ADD : TransactionType.ADMIN_SUBTRACT,
      description: updateBalanceDto.description,
      adminId: adminId ? new Types.ObjectId(adminId) : undefined,
    });
    await transaction.save();

    user.crowns += updateBalanceDto.amount;
    if (user.crowns < 0) {
      user.crowns = 0; // Не допускаем отрицательный баланс
    }
    await user.save();

    return {
      user,
      newBalance: user.crowns,
    };
  }

  async getUserStatistics(userId: string) {
    const user = await this.findUserById(userId);

    const purchases = await this.purchaseModel.find({ userId: new Types.ObjectId(userId) }).exec();
    const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

    const views = await this.viewModel.find({ userId: new Types.ObjectId(userId) }).exec();
    const totalViews = views.length;

    const referredBy = user.referredBy 
      ? await this.userModel.findById(user.referredBy).select('telegramId username displayName').exec()
      : null;

    const referrals = await this.userModel.find({ _id: { $in: user.referrals } })
      .select('telegramId username displayName registeredAt lastActivityAt').exec();

    return {
      telegramId: user.telegramId,
      username: user.username,
      displayName: user.displayName,
      registeredAt: user.registeredAt,
      lastActivityAt: user.lastActivityAt,
      crowns: user.crowns,
      totalSpent,
      totalViews,
      referralsCount: referrals.length,
      referrals: referrals.map(r => ({
        telegramId: r.telegramId,
        username: r.username,
        displayName: r.displayName,
        registeredAt: r.registeredAt,
        lastActivityAt: r.lastActivityAt,
      })),
      referredBy: referredBy ? {
        telegramId: referredBy.telegramId,
        username: referredBy.username,
        displayName: referredBy.displayName,
      } : null,
    };
  }

  async purchaseCrowns(telegramId: number, purchaseCrownsDto: PurchaseCrownsDto): Promise<{
    success: boolean;
    user: UserDocument;
    crownsAdded: number;
    amount: number;
    currency: string;
    purchase: CrownPurchaseDocument;
  }> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    // Получаем текущий курс
    const exchangeRate = await this.exchangeRateService.getCurrentRate();
    
    // Вычисляем количество корон в зависимости от валюты
    let crownsAmount: number;
    let exchangeRateUsed: number;
    
    switch (purchaseCrownsDto.currency) {
      case PaymentCurrency.RUB:
        crownsAmount = Math.floor(purchaseCrownsDto.amount / exchangeRate.rubPerCrown);
        exchangeRateUsed = exchangeRate.rubPerCrown;
        break;
      case PaymentCurrency.USD:
        crownsAmount = Math.floor(purchaseCrownsDto.amount / exchangeRate.usdPerCrown);
        exchangeRateUsed = exchangeRate.usdPerCrown;
        break;
      case PaymentCurrency.TELEGRAM_STAR:
        crownsAmount = Math.floor(purchaseCrownsDto.amount / exchangeRate.telegramStarPerCrown);
        exchangeRateUsed = exchangeRate.telegramStarPerCrown;
        break;
      default:
        throw new BadRequestException(`Unsupported currency: ${purchaseCrownsDto.currency}`);
    }

    // Создаем запись о покупке корон
    const crownPurchase = new this.crownPurchaseModel({
      userId: user._id,
      amount: purchaseCrownsDto.amount,
      currency: purchaseCrownsDto.currency,
      crownsAmount,
      exchangeRate: exchangeRateUsed,
      transactionHash: purchaseCrownsDto.transactionHash,
      purchasedAt: new Date(),
    });
    await crownPurchase.save();

    // Создаем транзакцию баланса
    const transaction = new this.balanceTransactionModel({
      userId: user._id,
      amount: crownsAmount,
      type: TransactionType.USDT_PURCHASE,
      description: `Purchase of ${crownsAmount} crowns for ${purchaseCrownsDto.amount} ${purchaseCrownsDto.currency}`,
    });
    await transaction.save();

    // Начисляем короны пользователю
    user.crowns += crownsAmount;
    await user.save();

    return {
      success: true,
      user,
      crownsAdded: crownsAmount,
      amount: purchaseCrownsDto.amount,
      currency: purchaseCrownsDto.currency,
      purchase: crownPurchase,
    };
  }
}

