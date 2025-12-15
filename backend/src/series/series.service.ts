import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Series, SeriesDocument, AudioLanguage, SubtitleLanguage, EpisodeMedia } from './schemas/series.schema';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { UploadEpisodeMediaDto } from './dto/upload-episode-media.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Purchase, PurchaseDocument } from '../users/schemas/purchase.schema';
import { View, ViewDocument } from '../users/schemas/view.schema';
import { BalanceTransaction, BalanceTransactionDocument, TransactionType } from '../users/schemas/balance-transaction.schema';
import { TaskService } from '../users/task.service';
import { TaskType } from '../users/schemas/task.schema';

// Все требуемые комбинации (порядок важен для последовательной загрузки)
// Сначала русская озвучка без субтитров, потом с разными субтитрами
// Затем английская озвучка без субтитров, потом с разными субтитрами
const REQUIRED_COMBINATIONS = [
  { audio: AudioLanguage.RUSSIAN, subtitle: SubtitleLanguage.NONE }, // 1. Русская озвучка без субтитров
  { audio: AudioLanguage.RUSSIAN, subtitle: SubtitleLanguage.RUSSIAN }, // 2. Русская озвучка + русские субтитры
  { audio: AudioLanguage.RUSSIAN, subtitle: SubtitleLanguage.ENGLISH }, // 3. Русская озвучка + английские субтитры
  { audio: AudioLanguage.RUSSIAN, subtitle: SubtitleLanguage.PORTUGUESE }, // 4. Русская озвучка + португальские субтитры
  { audio: AudioLanguage.RUSSIAN, subtitle: SubtitleLanguage.HINDI }, // 5. Русская озвучка + субтитры хинди
  { audio: AudioLanguage.RUSSIAN, subtitle: SubtitleLanguage.TURKISH }, // 6. Русская озвучка + турецкие субтитры
  { audio: AudioLanguage.ENGLISH, subtitle: SubtitleLanguage.NONE }, // 7. Английская озвучка без субтитров
  { audio: AudioLanguage.ENGLISH, subtitle: SubtitleLanguage.ENGLISH }, // 8. Английская озвучка + англ субтитры
  { audio: AudioLanguage.ENGLISH, subtitle: SubtitleLanguage.RUSSIAN }, // 9. Английская озвучка + русские субтитры
  { audio: AudioLanguage.ENGLISH, subtitle: SubtitleLanguage.PORTUGUESE }, // 10. Английская озвучка + португальские субтитры
  { audio: AudioLanguage.ENGLISH, subtitle: SubtitleLanguage.HINDI }, // 11. Английская озвучка + субтитры хинди
  { audio: AudioLanguage.ENGLISH, subtitle: SubtitleLanguage.TURKISH }, // 12. Английская озвучка + турецкие субтитры
];

@Injectable()
export class SeriesService {
  constructor(
    @InjectModel(Series.name) private seriesModel: Model<SeriesDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(View.name) private viewModel: Model<ViewDocument>,
    @InjectModel(BalanceTransaction.name) private balanceTransactionModel: Model<BalanceTransactionDocument>,
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService,
  ) {}

  async create(createSeriesDto: CreateSeriesDto, coverImagePath?: string): Promise<SeriesDocument> {
    const series = new this.seriesModel({
      ...createSeriesDto,
      coverImage: coverImagePath,
      isVisible: false,
      freeEpisodesCount: createSeriesDto.freeEpisodesCount ?? 0,
      episodes: [],
    });
    return series.save();
  }

  async findAll(): Promise<SeriesDocument[]> {
    return this.seriesModel.find().exec();
  }

  async findOne(id: string): Promise<SeriesDocument> {
    const series = await this.seriesModel.findById(id).exec();
    if (!series) {
      throw new NotFoundException(`Series with ID ${id} not found`);
    }
    return series;
  }

  async update(id: string, updateSeriesDto: UpdateSeriesDto, coverImagePath?: string): Promise<SeriesDocument> {
    const updateData = { ...updateSeriesDto };
    if (coverImagePath) {
      updateData['coverImage'] = coverImagePath;
    }
    const series = await this.seriesModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!series) {
      throw new NotFoundException(`Series with ID ${id} not found`);
    }
    return series;
  }

  async toggleVisibility(id: string): Promise<SeriesDocument> {
    const series = await this.findOne(id);
    series.isVisible = !series.isVisible;
    return series.save();
  }

  async addEpisode(seriesId: string, episodeNumber: number): Promise<{ series: SeriesDocument; firstCombination: { audio: AudioLanguage; subtitle: SubtitleLanguage } }> {
    const series = await this.findOne(seriesId);
    
    // Проверяем, существует ли уже такая серия
    const existingEpisode = series.episodes.find(e => e.episodeNumber === episodeNumber);
    if (existingEpisode) {
      throw new ConflictException(`Episode ${episodeNumber} already exists`);
    }

    series.episodes.push({
      episodeNumber,
      media: [],
      isComplete: false,
    });

    // Помечаем episodes как измененный, чтобы Mongoose сохранил изменения
    series.markModified('episodes');
    await series.save();

    // Возвращаем первую комбинацию для загрузки
    return {
      series,
      firstCombination: REQUIRED_COMBINATIONS[0],
    };
  }

  async uploadEpisodeMedia(
    seriesId: string,
    uploadDto: UploadEpisodeMediaDto,
    videoPath: string,
  ): Promise<{ series: SeriesDocument; nextCombination?: { audio: AudioLanguage; subtitle: SubtitleLanguage } }> {
    const series = await this.findOne(seriesId);
    
    const episode = series.episodes.find(e => e.episodeNumber === uploadDto.episodeNumber);
    if (!episode) {
      throw new NotFoundException(`Episode ${uploadDto.episodeNumber} not found`);
    }

    // Проверяем, не загружена ли уже эта комбинация
    const existingMedia = episode.media.find(
      m => m.audioLanguage === uploadDto.audioLanguage && m.subtitleLanguage === uploadDto.subtitleLanguage
    );
    if (existingMedia) {
      throw new ConflictException(`Media with ${uploadDto.audioLanguage} audio and ${uploadDto.subtitleLanguage} subtitles already exists`);
    }

    // Добавляем новую медиа
    episode.media.push({
      audioLanguage: uploadDto.audioLanguage,
      subtitleLanguage: uploadDto.subtitleLanguage,
      videoUrl: videoPath,
      filePath: videoPath,
    });

    // Проверяем, все ли комбинации загружены
    const uploadedCombinations = episode.media.map(m => ({
      audio: m.audioLanguage,
      subtitle: m.subtitleLanguage,
    }));

    const allUploaded = REQUIRED_COMBINATIONS.every(required =>
      uploadedCombinations.some(uploaded =>
        uploaded.audio === required.audio && uploaded.subtitle === required.subtitle
      )
    );

    episode.isComplete = allUploaded;

    // Помечаем episodes как измененный, чтобы Mongoose сохранил изменения
    series.markModified('episodes');
    await series.save();

    // Определяем следующую комбинацию для загрузки
    const nextCombination = this.getNextRequiredCombination(uploadedCombinations);

    return {
      series,
      nextCombination,
    };
  }

  private getNextRequiredCombination(uploaded: Array<{ audio: AudioLanguage; subtitle: SubtitleLanguage }>): { audio: AudioLanguage; subtitle: SubtitleLanguage } | undefined {
    return REQUIRED_COMBINATIONS.find(required =>
      !uploaded.some(uploadedItem =>
        uploadedItem.audio === required.audio && uploadedItem.subtitle === required.subtitle
      )
    );
  }

  async getEpisodeProgress(seriesId: string, episodeNumber: number): Promise<{
    uploaded: Array<{ audio: AudioLanguage; subtitle: SubtitleLanguage }>;
    remaining: Array<{ audio: AudioLanguage; subtitle: SubtitleLanguage }>;
    isComplete: boolean;
  }> {
    const series = await this.findOne(seriesId);
    const episode = series.episodes.find(e => e.episodeNumber === episodeNumber);
    
    if (!episode) {
      throw new NotFoundException(`Episode ${episodeNumber} not found`);
    }

    const uploaded = episode.media.map(m => ({
      audio: m.audioLanguage,
      subtitle: m.subtitleLanguage,
    }));

    const remaining = REQUIRED_COMBINATIONS.filter(required =>
      !uploaded.some(uploaded =>
        uploaded.audio === required.audio && uploaded.subtitle === required.subtitle
      )
    );

    return {
      uploaded,
      remaining,
      isComplete: episode.isComplete,
    };
  }

  async deleteEpisode(seriesId: string, episodeNumber: number): Promise<SeriesDocument> {
    const series = await this.findOne(seriesId);
    
    const episodeIndex = series.episodes.findIndex(e => e.episodeNumber === episodeNumber);
    if (episodeIndex === -1) {
      throw new NotFoundException(`Episode ${episodeNumber} not found`);
    }

    const episode = series.episodes[episodeIndex];

    // Удаляем все медиа файлы эпизода
    for (const media of episode.media) {
      if (media.filePath) {
        const mediaPath = join(process.cwd(), media.filePath);
        if (existsSync(mediaPath)) {
          try {
            unlinkSync(mediaPath);
          } catch (error) {
            console.error(`Failed to delete media file: ${mediaPath}`, error);
          }
        }
      }
    }

    // Удаляем эпизод из массива
    series.episodes.splice(episodeIndex, 1);
    
    // Помечаем episodes как измененный, чтобы Mongoose сохранил изменения
    series.markModified('episodes');
    await series.save();

    return series;
  }

  async delete(id: string): Promise<void> {
    const series = await this.findOne(id);
    
    // Удаляем обложку сериала, если она существует
    if (series.coverImage) {
      const coverPath = join(process.cwd(), series.coverImage);
      if (existsSync(coverPath)) {
        try {
          unlinkSync(coverPath);
        } catch (error) {
          console.error(`Failed to delete cover image: ${coverPath}`, error);
        }
      }
    }

    // Удаляем все медиа файлы эпизодов
    for (const episode of series.episodes) {
      for (const media of episode.media) {
        if (media.filePath) {
          const mediaPath = join(process.cwd(), media.filePath);
          if (existsSync(mediaPath)) {
            try {
              unlinkSync(mediaPath);
            } catch (error) {
              console.error(`Failed to delete media file: ${mediaPath}`, error);
            }
          }
        }
      }
    }

    // Удаляем сериал из базы данных
    await this.seriesModel.findByIdAndDelete(id).exec();
  }

  // Публичные методы для пользователей
  async findVisible(): Promise<SeriesDocument[]> {
    const series = await this.seriesModel.find({ isVisible: true }).select('-episodes').exec();
    return series;
  }

  async findOneVisible(id: string, withEpisodes: boolean = false): Promise<SeriesDocument> {
    const query = this.seriesModel.findOne({ _id: id, isVisible: true });
    if (!withEpisodes) {
      query.select('-episodes');
    }
    const series = await query.exec();
    if (!series) {
      throw new NotFoundException(`Series with ID ${id} not found or not visible`);
    }

    return series;
  }

  async purchaseSeries(seriesId: string, telegramId: number): Promise<{
    success: boolean;
    user: UserDocument;
    series: SeriesDocument;
    purchase: PurchaseDocument;
    newBalance: number;
  }> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const series = await this.findOneVisible(seriesId);

    // Проверяем, не куплен ли уже сериал
    const existingPurchase = await this.purchaseModel.findOne({
      userId: user._id,
      seriesId: new Types.ObjectId(seriesId),
    }).exec();

    if (existingPurchase) {
      throw new ConflictException('Series already purchased');
    }

    // Проверяем баланс
    if (user.crowns < series.price) {
      throw new BadRequestException('Insufficient crowns balance');
    }

    // Создаем запись о покупке
    const purchase = new this.purchaseModel({
      userId: user._id,
      seriesId: new Types.ObjectId(seriesId),
      amount: series.price,
      purchasedAt: new Date(),
    });
    await purchase.save();

    // Создаем транзакцию баланса
    const transaction = new this.balanceTransactionModel({
      userId: user._id,
      amount: -series.price,
      type: TransactionType.PURCHASE,
      description: `Purchase of series "${series.title}"`,
    });
    await transaction.save();

    // Списываем короны
    user.crowns -= series.price;
    await user.save();

    return {
      success: true,
      user,
      series,
      purchase,
      newBalance: user.crowns,
    };
  }

  async getEpisodes(seriesId: string): Promise<any> {
    const series = await this.findOneVisible(seriesId, true);
    
    // Для опциональной проверки покупки нужно передавать токен через query или header
    // Пока оставляем как есть - без проверки покупки для публичного доступа
    const isPurchased = false;

    // Возвращаем список эпизодов
    const episodes = series.episodes.map(episode => {
      const isFree = episode.episodeNumber <= (series.freeEpisodesCount || 0);
      return {
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        description: episode.description,
        isComplete: episode.isComplete,
        isFree, // Помечаем бесплатные эпизоды
        // Если сериал куплен или эпизод бесплатный, показываем количество доступных медиа
        availableMediaCount: (isPurchased || isFree) ? episode.media.length : 0,
      };
    });

    return {
      series: {
        _id: series._id,
        title: series.title,
        description: series.description,
        coverImage: series.coverImage,
        price: series.price,
        freeEpisodesCount: series.freeEpisodesCount || 0,
      },
      episodes,
      isPurchased,
    };
  }

  async getEpisode(seriesId: string, episodeNumber: number, telegramId?: number): Promise<any> {
    const series = await this.findOneVisible(seriesId, true);
    
    const episode = series.episodes.find(e => e.episodeNumber === episodeNumber);
    if (!episode) {
      throw new NotFoundException(`Episode ${episodeNumber} not found`);
    }

    // Проверяем, является ли эпизод бесплатным
    const isFree = episodeNumber <= (series.freeEpisodesCount || 0);

    let isPurchased = false;
    if (telegramId) {
      const user = await this.userModel.findOne({ telegramId }).exec();
      if (user) {
        const purchase = await this.purchaseModel.findOne({
          userId: user._id,
          seriesId: new Types.ObjectId(seriesId),
        }).exec();
        isPurchased = !!purchase;
      }
    }

    const canAccessMedia = isFree || isPurchased;
    if(!canAccessMedia) {
      throw new ForbiddenException('You are not authorized to access this episode');
    }
    
    return {
      episode,
      isPurchased,
      isFree
    };
  }

  async recordView(seriesId: string, episodeNumber: number, telegramId: number): Promise<ViewDocument> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const series = await this.findOneVisible(seriesId);
    const episode = series.episodes.find(e => e.episodeNumber === episodeNumber);
    if (!episode) {
      throw new NotFoundException(`Episode ${episodeNumber} not found`);
    }

    // Проверяем, является ли эпизод бесплатным
    const isFree = episodeNumber <= (series.freeEpisodesCount || 0);

    // Если эпизод не бесплатный, проверяем, куплен ли сериал
    if (!isFree) {
      const purchase = await this.purchaseModel.findOne({
        userId: user._id,
        seriesId: new Types.ObjectId(seriesId),
      }).exec();

      if (!purchase) {
        throw new BadRequestException('Series must be purchased before viewing this episode');
      }
    }

    // Создаем запись о просмотре
    const view = new this.viewModel({
      userId: user._id,
      seriesId: new Types.ObjectId(seriesId),
      episodeNumber,
      viewedAt: new Date(),
    });
    await view.save();

    // Обновляем активность пользователя
    user.lastActivityAt = new Date();
    await user.save();

    // Проверяем автоматические задания на просмотр сериала
    try {
      const userId: Types.ObjectId = user._id as Types.ObjectId;
      await this.taskService.checkAndRewardAutomaticTask(
        userId,
        TaskType.WATCH_SERIES,
        { seriesId: new Types.ObjectId(seriesId) },
      );
    } catch (error) {
      // Игнорируем ошибки при проверке заданий (чтобы не ломать основной функционал)
      console.error('Error checking automatic task for view:', error);
    }

    return view;
  }
}

