import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Series, SeriesSchema } from '../series/schemas/series.schema';
import { Purchase, PurchaseSchema } from '../users/schemas/purchase.schema';
import { CrownPurchase, CrownPurchaseSchema } from '../users/schemas/crown-purchase.schema';
import { View, ViewSchema } from '../users/schemas/view.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Series.name, schema: SeriesSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: CrownPurchase.name, schema: CrownPurchaseSchema },
      { name: View.name, schema: ViewSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}

