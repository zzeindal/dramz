import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Series, SeriesDocument } from '../series/schemas/series.schema';
import { Purchase, PurchaseDocument } from '../users/schemas/purchase.schema';
import { CrownPurchase, CrownPurchaseDocument } from '../users/schemas/crown-purchase.schema';
import { View, ViewDocument } from '../users/schemas/view.schema';
import { DateRangeDto } from './dto/date-range.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Series.name) private seriesModel: Model<SeriesDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(CrownPurchase.name) private crownPurchaseModel: Model<CrownPurchaseDocument>,
    @InjectModel(View.name) private viewModel: Model<ViewDocument>,
  ) {}

  async getGeneralStatistics(dateRange?: DateRangeDto) {
    const dateFilter = this.buildDateFilter(dateRange);

    // Количество пользователей
    const totalUsers = await this.userModel.countDocuments();
    const usersInRange = dateFilter 
      ? await this.userModel.countDocuments({ registeredAt: dateFilter })
      : totalUsers;

    // Количество просмотров
    const viewsFilter = dateRange?.startDate || dateRange?.endDate
      ? { viewedAt: this.buildDateFilter(dateRange) }
      : {};
    const totalViews = await this.viewModel.countDocuments(viewsFilter);

    // Доходы (из покупок корон)
    const crownPurchasesFilter = dateRange?.startDate || dateRange?.endDate
      ? { purchasedAt: this.buildDateFilter(dateRange) }
      : {};
    const crownPurchases = await this.crownPurchaseModel.find(crownPurchasesFilter).exec();
    
    // Считаем доход в разных валютах
    const revenueUsd = crownPurchases
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + p.amount, 0);
    const revenueRub = crownPurchases
      .filter(p => p.currency === 'RUB')
      .reduce((sum, p) => sum + p.amount, 0);
    const revenueTelegramStars = crownPurchases
      .filter(p => p.currency === 'TELEGRAM_STAR')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Статистика покупок сериалов (в коронах)
    const purchasesFilter = dateRange?.startDate || dateRange?.endDate
      ? { purchasedAt: this.buildDateFilter(dateRange) }
      : {};
    const purchases = await this.purchaseModel.find(purchasesFilter).exec();
    const totalCrownsSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

    // Просмотры по сериям
    const viewsByEpisode = await this.viewModel.aggregate([
      { $match: viewsFilter },
      {
        $group: {
          _id: {
            seriesId: '$seriesId',
            episodeNumber: '$episodeNumber',
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'series',
          localField: '_id.seriesId',
          foreignField: '_id',
          as: 'series',
        },
      },
      {
        $unwind: {
          path: '$series',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          seriesId: '$_id.seriesId',
          seriesTitle: '$series.title',
          episodeNumber: '$_id.episodeNumber',
          views: '$count',
        },
      },
      { $sort: { views: -1 } },
    ]);

    return {
      users: {
        total: totalUsers,
        inRange: usersInRange,
      },
      views: {
        total: totalViews,
      },
      revenue: {
        usd: revenueUsd, // Доход в USD
        rub: revenueRub, // Доход в RUB
        telegramStars: revenueTelegramStars, // Доход в Telegram Stars
        totalUsd: revenueUsd + (revenueRub / 100) + (revenueTelegramStars / 100), // Общий доход в USD (примерный)
      },
      purchases: {
        totalCrownsSpent, // Всего потрачено корон на покупку сериалов
        totalPurchases: purchases.length, // Количество покупок сериалов
        totalCrownPurchases: crownPurchases.length, // Количество покупок корон за USDT
      },
      viewsByEpisode,
    };
  }

  async getSeriesStatistics(seriesId: string, dateRange?: DateRangeDto) {
    const series = await this.seriesModel.findById(seriesId).exec();
    if (!series) {
      throw new Error(`Series with ID ${seriesId} not found`);
    }

    const dateFilter = this.buildDateFilter(dateRange);

    const viewsFilter: any = { seriesId: new Types.ObjectId(seriesId) };
    if (dateFilter) {
      viewsFilter.viewedAt = dateFilter;
    }

    const views = await this.viewModel.find(viewsFilter).exec();

    // Группируем просмотры по сериям
    const viewsByEpisode = views.reduce((acc, view) => {
      const epNum = view.episodeNumber;
      if (!acc[epNum]) {
        acc[epNum] = 0;
      }
      acc[epNum]++;
      return acc;
    }, {} as Record<number, number>);

    // Покупки этого сериала (в коронах)
    const purchasesFilter: any = { seriesId: new Types.ObjectId(seriesId) };
    if (dateFilter) {
      purchasesFilter.purchasedAt = dateFilter;
    }
    const purchases = await this.purchaseModel.find(purchasesFilter).exec();
    const totalCrownsSpent = purchases.reduce((sum, p) => sum + p.amount, 0);
    const purchaseCount = purchases.length;

    return {
      series: {
        id: series._id,
        title: series.title,
      },
      views: {
        total: views.length,
        byEpisode: viewsByEpisode,
      },
      purchases: {
        count: purchaseCount,
        totalCrownsSpent, // Всего потрачено корон на этот сериал
        currency: 'crowns',
      },
    };
  }

  private buildDateFilter(dateRange?: DateRangeDto) {
    if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) {
      return undefined;
    }

    const filter: any = {};
    if (dateRange.startDate) {
      filter.$gte = new Date(dateRange.startDate);
    }
    if (dateRange.endDate) {
      filter.$lte = new Date(dateRange.endDate);
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }
}

