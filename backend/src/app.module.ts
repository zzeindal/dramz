import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SeriesModule } from './series/series.module';
import { UsersModule } from './users/users.module';
import { StatisticsModule } from './statistics/statistics.module';
import { FilesModule } from './files/files.module';
import { UserSeriesModule } from './user-series/user-series.module';
import { AuthModule } from './auth/auth.module';
import { FaqModule } from './faq/faq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/dramz'),
    AuthModule,
    SeriesModule,
    UsersModule,
    StatisticsModule,
    FilesModule,
    UserSeriesModule,
    FaqModule,
  ],
})
export class AppModule {}

