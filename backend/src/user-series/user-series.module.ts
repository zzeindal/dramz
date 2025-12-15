import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSeriesController } from './user-series.controller';
import { UserSeriesService } from './user-series.service';
import { Like, LikeSchema } from './schemas/like.schema';
import { Bookmark, BookmarkSchema } from './schemas/bookmark.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Series, SeriesSchema } from '../series/schemas/series.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Like.name, schema: LikeSchema },
      { name: Bookmark.name, schema: BookmarkSchema },
      { name: User.name, schema: UserSchema },
      { name: Series.name, schema: SeriesSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [UserSeriesController],
  providers: [UserSeriesService],
  exports: [UserSeriesService],
})
export class UserSeriesModule {}

