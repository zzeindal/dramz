import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';
import { Bookmark, BookmarkDocument } from './schemas/bookmark.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Series, SeriesDocument } from '../series/schemas/series.schema';
import { TaskService } from '../users/task.service';
import { TaskType } from '../users/schemas/task.schema';

@Injectable()
export class UserSeriesService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Series.name) private seriesModel: Model<SeriesDocument>,
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService,
  ) {}

  async toggleLike(seriesId: string, telegramId: number): Promise<{ isLiked: boolean; likesCount: number }> {
    // Находим пользователя по telegramId
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    // Проверяем существование сериала
    const series = await this.seriesModel.findById(seriesId).exec();
    if (!series) {
      throw new NotFoundException(`Series with ID ${seriesId} not found`);
    }

    // Проверяем, есть ли уже лайк
    const existingLike = await this.likeModel.findOne({
      userId: user._id,
      seriesId: new Types.ObjectId(seriesId),
    }).exec();

    if (existingLike) {
      // Убираем лайк
      await this.likeModel.findByIdAndDelete(existingLike._id).exec();
      const likesCount = await this.likeModel.countDocuments({ seriesId: new Types.ObjectId(seriesId) }).exec();
      return { isLiked: false, likesCount };
    } else {
      // Добавляем лайк
      const like = new this.likeModel({
        userId: user._id,
        seriesId: new Types.ObjectId(seriesId),
      });
      await like.save();
      const likesCount = await this.likeModel.countDocuments({ seriesId: new Types.ObjectId(seriesId) }).exec();
      
      // Проверяем автоматические задания на лайк сериала
      try {
        await this.taskService.checkAndRewardAutomaticTask(
          user._id as Types.ObjectId,
          TaskType.LIKE_SERIES,
          { seriesId: new Types.ObjectId(seriesId) },
        );
      } catch (error) {
        // Игнорируем ошибки при проверке заданий (чтобы не ломать основной функционал)
        console.error('Error checking automatic task for like:', error);
      }
      
      return { isLiked: true, likesCount };
    }
  }

  async toggleBookmark(seriesId: string, telegramId: number): Promise<{ isBookmarked: boolean; bookmarksCount: number }> {
    // Находим пользователя по telegramId
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    // Проверяем существование сериала
    const series = await this.seriesModel.findById(seriesId).exec();
    if (!series) {
      throw new NotFoundException(`Series with ID ${seriesId} not found`);
    }

    // Проверяем, есть ли уже сохранение
    const existingBookmark = await this.bookmarkModel.findOne({
      userId: user._id,
      seriesId: new Types.ObjectId(seriesId),
    }).exec();

    if (existingBookmark) {
      // Убираем из сохраненных
      await this.bookmarkModel.findByIdAndDelete(existingBookmark._id).exec();
      const bookmarksCount = await this.bookmarkModel.countDocuments({ seriesId: new Types.ObjectId(seriesId) }).exec();
      return { isBookmarked: false, bookmarksCount };
    } else {
      // Добавляем в сохраненные
      const bookmark = new this.bookmarkModel({
        userId: user._id,
        seriesId: new Types.ObjectId(seriesId),
      });
      await bookmark.save();
      const bookmarksCount = await this.bookmarkModel.countDocuments({ seriesId: new Types.ObjectId(seriesId) }).exec();
      return { isBookmarked: true, bookmarksCount };
    }
  }

  async getLikedSeries(telegramId: number): Promise<SeriesDocument[]> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const likes = await this.likeModel.find({ userId: user._id }).exec();
    const seriesIds = likes.map(like => like.seriesId);

    if (seriesIds.length === 0) {
      return [];
    }

    return this.seriesModel.find({ _id: { $in: seriesIds } }).exec();
  }

  async getBookmarkedSeries(telegramId: number): Promise<SeriesDocument[]> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const bookmarks = await this.bookmarkModel.find({ userId: user._id }).exec();
    const seriesIds = bookmarks.map(bookmark => bookmark.seriesId);

    if (seriesIds.length === 0) {
      return [];
    }

    return this.seriesModel.find({ _id: { $in: seriesIds } }).exec();
  }

  async checkUserSeriesStatus(seriesId: string, telegramId: number): Promise<{ isLiked: boolean; isBookmarked: boolean; likesCount: number; bookmarksCount: number }> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const series = await this.seriesModel.findById(seriesId).exec();
    if (!series) {
      throw new NotFoundException(`Series with ID ${seriesId} not found`);
    }

    const [isLiked, isBookmarked, likesCount, bookmarksCount] = await Promise.all([
      this.likeModel.exists({ userId: user._id, seriesId: new Types.ObjectId(seriesId) }),
      this.bookmarkModel.exists({ userId: user._id, seriesId: new Types.ObjectId(seriesId) }),
      this.likeModel.countDocuments({ seriesId: new Types.ObjectId(seriesId) }),
      this.bookmarkModel.countDocuments({ seriesId: new Types.ObjectId(seriesId) }),
    ]);

    return {
      isLiked: !!isLiked,
      isBookmarked: !!isBookmarked,
      likesCount,
      bookmarksCount,
    };
  }
}

