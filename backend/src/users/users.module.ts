import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { GameController } from './game.controller';
import { TaskController } from './task.controller';
import { UserTaskController } from './user-task.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Purchase, PurchaseSchema } from './schemas/purchase.schema';
import { CrownPurchase, CrownPurchaseSchema } from './schemas/crown-purchase.schema';
import { CrownExchangeRate, CrownExchangeRateSchema } from './schemas/crown-exchange-rate.schema';
import { View, ViewSchema } from './schemas/view.schema';
import { BalanceTransaction, BalanceTransactionSchema } from './schemas/balance-transaction.schema';
import { Referral, ReferralSchema } from './schemas/referral.schema';
import { Game, GameSchema } from './schemas/game.schema';
import { GameReward, GameRewardSchema } from './schemas/game-reward.schema';
import { FreeSeriesView, FreeSeriesViewSchema } from './schemas/free-series-view.schema';
import { Task, TaskSchema } from './schemas/task.schema';
import { TaskCompletion, TaskCompletionSchema } from './schemas/task-completion.schema';
import { Series, SeriesSchema } from '../series/schemas/series.schema';
import { ExchangeRateService } from './exchange-rate.service';
import { TelegramAuthService } from './telegram-auth.service';
import { GameService } from './game.service';
import { TaskService } from './task.service';
import { SseAuthService } from './sse-auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: CrownPurchase.name, schema: CrownPurchaseSchema },
      { name: CrownExchangeRate.name, schema: CrownExchangeRateSchema },
      { name: View.name, schema: ViewSchema },
      { name: BalanceTransaction.name, schema: BalanceTransactionSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Game.name, schema: GameSchema },
      { name: GameReward.name, schema: GameRewardSchema },
      { name: FreeSeriesView.name, schema: FreeSeriesViewSchema },
      { name: Task.name, schema: TaskSchema },
      { name: TaskCompletion.name, schema: TaskCompletionSchema },
      { name: Series.name, schema: SeriesSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [UsersController, UserController, ExchangeRateController, GameController, TaskController, UserTaskController],
  providers: [UsersService, UserService, ExchangeRateService, TelegramAuthService, GameService, TaskService, SseAuthService],
  exports: [UsersService, UserService, ExchangeRateService, GameService, TaskService, SseAuthService],
})
export class UsersModule {}

