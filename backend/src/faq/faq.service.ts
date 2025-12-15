import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq, FaqDocument } from './schemas/faq.schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(Faq.name) private faqModel: Model<FaqDocument>,
  ) {}

  async create(createFaqDto: CreateFaqDto): Promise<FaqDocument> {
    const faq = new this.faqModel({
      ...createFaqDto,
      order: createFaqDto.order ?? 0,
      isVisible: createFaqDto.isVisible ?? true,
    });
    return faq.save();
  }

  async findAll(): Promise<FaqDocument[]> {
    return this.faqModel.find().sort({ order: 1, createdAt: 1 }).exec();
  }

  async findVisible(): Promise<FaqDocument[]> {
    return this.faqModel.find({ isVisible: true }).sort({ order: 1, createdAt: 1 }).exec();
  }

  async findOne(id: string): Promise<FaqDocument> {
    const faq = await this.faqModel.findById(id).exec();
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto): Promise<FaqDocument> {
    const faq = await this.faqModel.findByIdAndUpdate(id, updateFaqDto, { new: true }).exec();
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async delete(id: string): Promise<void> {
    const result = await this.faqModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
  }
}

