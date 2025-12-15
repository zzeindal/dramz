import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeriesController } from './series.controller';
import { PublicSeriesController } from './public-series.controller';
import { SeriesService } from './series.service';
import { Series, SeriesSchema } from './schemas/series.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Purchase, PurchaseSchema } from '../users/schemas/purchase.schema';
import { View, ViewSchema } from '../users/schemas/view.schema';
import { BalanceTransaction, BalanceTransactionSchema } from '../users/schemas/balance-transaction.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Series.name, schema: SeriesSchema },
      { name: User.name, schema: UserSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: View.name, schema: ViewSchema },
      { name: BalanceTransaction.name, schema: BalanceTransactionSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [SeriesController, PublicSeriesController],
  providers: [SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}

