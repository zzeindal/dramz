import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CrownExchangeRate, CrownExchangeRateDocument } from './schemas/crown-exchange-rate.schema';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';

@Injectable()
export class ExchangeRateService {
  constructor(
    @InjectModel(CrownExchangeRate.name) private exchangeRateModel: Model<CrownExchangeRateDocument>,
  ) {}

  async getCurrentRate(): Promise<CrownExchangeRateDocument> {
    let rate = await this.exchangeRateModel.findOne({ isActive: true }).exec();
    
    // Если нет активного курса, создаем дефолтный
    if (!rate) {
      rate = new this.exchangeRateModel({
        rubPerCrown: 1,
        usdPerCrown: 0.01,
        telegramStarPerCrown: 1,
        isActive: true,
      });
      await rate.save();
    }
    
    return rate;
  }

  async updateRate(updateDto: UpdateExchangeRateDto, adminUsername?: string): Promise<CrownExchangeRateDocument> {
    const currentRate = await this.getCurrentRate();
    
    // Деактивируем старый курс
    currentRate.isActive = false;
    await currentRate.save();
    
    // Создаем новый активный курс
    const newRate = new this.exchangeRateModel({
      rubPerCrown: updateDto.rubPerCrown ?? currentRate.rubPerCrown,
      usdPerCrown: updateDto.usdPerCrown ?? currentRate.usdPerCrown,
      telegramStarPerCrown: updateDto.telegramStarPerCrown ?? currentRate.telegramStarPerCrown,
      isActive: true,
      changedBy: adminUsername,
    });
    
    await newRate.save();
    return newRate;
  }

  async getRateHistory(): Promise<CrownExchangeRateDocument[]> {
    return this.exchangeRateModel.find().sort({ createdAt: -1 }).exec();
  }
}

