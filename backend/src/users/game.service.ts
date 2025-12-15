import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Game, GameDocument } from './schemas/game.schema';
import { GameReward, GameRewardDocument, RewardType } from './schemas/game-reward.schema';
import { FreeSeriesView, FreeSeriesViewDocument } from './schemas/free-series-view.schema';
import { BalanceTransaction, BalanceTransactionDocument, TransactionType } from './schemas/balance-transaction.schema';
import { Series, SeriesDocument } from '../series/schemas/series.schema';

// Конфигурация призов (можно легко изменить)
// Порядок важен для правильного розыгрыша
const REWARD_CONFIG = [
  { type: 'SMALL', probability: 0.70, crowns: 20 }, // 70% - 20 корон
  { type: 'MEDIUM', probability: 0.245, crowns: 35 }, // 24.5% - 35 корон
  { type: 'LARGE', probability: 0.045, crowns: 45 }, // 4.5% - 45 корон
  { type: 'SUPER_RARE', probability: 0.01 }, // 1% - Бесплатный просмотр сериала
] as const;

// Вспомогательный объект для быстрого доступа по типу
const REWARD_CONFIG_MAP = {
  SMALL: { probability: 0.70, crowns: 20 },
  MEDIUM: { probability: 0.245, crowns: 35 },
  LARGE: { probability: 0.045, crowns: 45 },
  SUPER_RARE: { probability: 0.01 },
};

const GAME_COOLDOWN_HOURS = 1; // 1 час между играми
const MAX_LIVES = 3;

@Injectable()
export class GameService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(GameReward.name) private gameRewardModel: Model<GameRewardDocument>,
    @InjectModel(FreeSeriesView.name) private freeSeriesViewModel: Model<FreeSeriesViewDocument>,
    @InjectModel(BalanceTransaction.name) private balanceTransactionModel: Model<BalanceTransactionDocument>,
    @InjectModel(Series.name) private seriesModel: Model<SeriesDocument>,
  ) {}

  /**
   * Получить состояние игры пользователя
   */
  async getGameState(telegramId: number) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    let game = await this.gameModel.findOne({ userId: user._id }).exec();

    // Если игры нет, создаем новую
    if (!game) {
      game = new this.gameModel({
        userId: user._id,
        lives: MAX_LIVES,
        lastPlayedAt: null,
      });
      await game.save();
    } else {
      // Проверяем, прошло ли 1 час с последней игры
      const canPlay = this.canPlayGame(game);
      if (canPlay.canPlay) {
        // Восстанавливаем жизни до максимума
        game.lives = MAX_LIVES;
        game.lastPlayedAt = null;
        await game.save();
      }
    }

    // Получаем актуальное состояние после возможного обновления
    game = await this.gameModel.findOne({ userId: user._id }).exec();
    const canPlay = this.canPlayGame(game);

    return {
      lives: game.lives,
      maxLives: MAX_LIVES,
      canPlay: canPlay.canPlay && game.lives > 0,
      nextPlayAvailableAt: canPlay.nextPlayAvailableAt,
      lastPlayedAt: game.lastPlayedAt,
    };
  }

  /**
   * Сыграть в игру
   */
  async playGame(telegramId: number) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    let game = await this.gameModel.findOne({ userId: user._id }).exec();

    // Если игры нет, создаем новую
    if (!game) {
      game = new this.gameModel({
        userId: user._id,
        lives: MAX_LIVES,
        lastPlayedAt: null,
      });
    } else {
      // Проверяем, прошло ли 1 час с последней игры
      const canPlay = this.canPlayGame(game);
      if (canPlay.canPlay) {
        // Восстанавливаем жизни до максимума
        game.lives = MAX_LIVES;
        game.lastPlayedAt = null;
      }
    }

    // Получаем актуальное состояние после возможного обновления
    game = await this.gameModel.findOne({ userId: user._id }).exec();
    
    // Проверяем доступность игры
    const canPlay = this.canPlayGame(game);
    if (!canPlay.canPlay) {
      const minutesLeft = Math.ceil((canPlay.nextPlayAvailableAt.getTime() - Date.now()) / 1000 / 60);
      throw new BadRequestException(
        `Игра будет доступна через ${minutesLeft} минут`,
      );
    }

    // Проверяем наличие жизней
    if (game.lives <= 0) {
      throw new BadRequestException('У вас закончились жизни. Попробуйте через 1 час.');
    }

    // Розыгрыш приза
    const reward = this.drawReward();

    // Выдаем приз
    let rewardData: any = {
      rewardType: reward.type,
    };

    if (reward.type === RewardType.SUPER_RARE) {
      // Бесплатный просмотр сериала
      const firstSeries = await this.getFirstSeries();
      if (!firstSeries) {
        // Если нет сериалов, выдаем крупный приз вместо супер-редкого
        rewardData.rewardType = RewardType.LARGE;
        rewardData.crownsAmount = REWARD_CONFIG_MAP.LARGE.crowns;
        await this.grantCrowns(user, REWARD_CONFIG_MAP.LARGE.crowns);
      } else {
        // Создаем запись о бесплатном просмотре
        const freeView = new this.freeSeriesViewModel({
          userId: user._id,
          seriesId: firstSeries._id,
          grantedAt: new Date(),
          isUsed: false,
        });
        await freeView.save();

        rewardData.seriesId = firstSeries._id;
        rewardData.seriesTitle = firstSeries.title;
      }
    } else {
      // Выдаем короны
      const rewardConfig = REWARD_CONFIG_MAP[reward.type];
      const crownsAmount = rewardConfig.crowns;
      rewardData.crownsAmount = crownsAmount;
      await this.grantCrowns(user, crownsAmount);
    }

    // Сохраняем награду в историю
    const gameReward = new this.gameRewardModel({
      userId: user._id,
      rewardType: rewardData.rewardType,
      crownsAmount: rewardData.crownsAmount,
      seriesId: rewardData.seriesId,
      rewardedAt: new Date(),
    });
    await gameReward.save();

    // Уменьшаем жизни
    game.lives -= 1;
    game.lastPlayedAt = new Date();
    await game.save();

    return {
      success: true,
      reward: rewardData,
      remainingLives: game.lives,
      nextPlayAvailableAt: canPlay.nextPlayAvailableAt,
    };
  }

  /**
   * Проверка возможности игры
   * Возвращает true, если прошло 1 час с последней игры
   */
  private canPlayGame(game: GameDocument): { canPlay: boolean; nextPlayAvailableAt: Date } {
    if (!game.lastPlayedAt) {
      return { canPlay: true, nextPlayAvailableAt: new Date() };
    }

    const now = new Date();
    const lastPlayed = new Date(game.lastPlayedAt);
    const hoursSinceLastPlay = (now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastPlay >= GAME_COOLDOWN_HOURS) {
      return { canPlay: true, nextPlayAvailableAt: new Date() };
    }

    const nextPlayAvailableAt = new Date(
      lastPlayed.getTime() + GAME_COOLDOWN_HOURS * 60 * 60 * 1000,
    );

    return { canPlay: false, nextPlayAvailableAt };
  }

  /**
   * Розыгрыш приза по вероятностям
   */
  private drawReward(): { type: RewardType } {
    const random = Math.random();

    let cumulative = 0;
    for (const config of REWARD_CONFIG) {
      cumulative += config.probability;
      if (random <= cumulative) {
        // Маппинг строковых типов на enum RewardType
        const typeMap: Record<string, RewardType> = {
          'SMALL': RewardType.SMALL,
          'MEDIUM': RewardType.MEDIUM,
          'LARGE': RewardType.LARGE,
          'SUPER_RARE': RewardType.SUPER_RARE,
        };
        return { type: typeMap[config.type] };
      }
    }

    // Fallback на малый приз (не должно произойти)
    return { type: RewardType.SMALL };
  }

  /**
   * Выдать короны пользователю
   */
  private async grantCrowns(user: UserDocument, amount: number) {
    user.crowns += amount;
    await user.save();

    // Создаем транзакцию
    const transaction = new this.balanceTransactionModel({
      userId: user._id,
      amount: amount,
      type: TransactionType.GAME_REWARD,
      description: `Награда за игру: ${amount} корон`,
    });
    await transaction.save();
  }

  /**
   * Получить первый сериал (для супер-редкого приза)
   * Можно легко изменить логику выбора сериала
   */
  private async getFirstSeries(): Promise<SeriesDocument | null> {
    // Ищем первый видимый сериал, отсортированный по дате создания
    return this.seriesModel
      .findOne({ isVisible: true })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Получить историю наград пользователя
   */
  async getRewardHistory(telegramId: number, limit: number = 10) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const rewards = await this.gameRewardModel
      .find({ userId: user._id })
      .sort({ rewardedAt: -1 })
      .limit(limit)
      .populate('seriesId', 'title')
      .exec();

    return rewards.map((reward) => ({
      rewardType: reward.rewardType,
      crownsAmount: reward.crownsAmount,
      series: reward.seriesId
        ? {
            id: (reward.seriesId as any)._id,
            title: (reward.seriesId as any).title,
          }
        : null,
      rewardedAt: reward.rewardedAt,
    }));
  }
}

