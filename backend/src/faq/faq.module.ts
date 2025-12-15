import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqController } from './faq.controller';
import { PublicFaqController } from './public-faq.controller';
import { FaqService } from './faq.service';
import { Faq, FaqSchema } from './schemas/faq.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Faq.name, schema: FaqSchema }]),
  ],
  controllers: [FaqController, PublicFaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}

