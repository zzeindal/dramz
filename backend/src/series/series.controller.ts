import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { UploadEpisodeMediaDto } from './dto/upload-episode-media.dto';
import { EpisodeProgressResponseDto } from './dto/episode-progress-response.dto';
import { AddEpisodeDto } from './dto/add-episode.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@ApiTags('series')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: './uploads/covers',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `cover-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Создать новый сериал',
    description: 'Создает новый сериал с обложкой, названием, описанием и ценой. По умолчанию сериал скрыт из мини-приложения. Можно указать количество бесплатных эпизодов.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Название сериала' },
        description: { type: 'string', description: 'Описание сериала' },
        price: { type: 'number', description: 'Цена в коронах' },
        freeEpisodesCount: { type: 'number', description: 'Количество бесплатных эпизодов (первые N эпизодов будут доступны без покупки)', minimum: 0, default: 0 },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Обложка сериала (изображение, макс. 5MB)',
        },
      },
      required: ['title', 'description', 'price', 'cover'],
    },
  })
  @ApiResponse({ status: 201, description: 'Сериал успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async create(
    @Body() createSeriesDto: CreateSeriesDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    cover: Express.Multer.File,
  ) {
    // Нормализуем путь: делаем относительным от корня проекта
    const normalizedPath = cover.path.startsWith(process.cwd())
      ? cover.path.replace(process.cwd() + '/', '')
      : cover.path.replace(/^\.\//, '');
    return this.seriesService.create(createSeriesDto, normalizedPath);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех сериалов',
    description: 'Возвращает список всех сериалов (включая скрытые)',
  })
  @ApiResponse({ status: 200, description: 'Список сериалов успешно получен' })
  async findAll() {
    return this.seriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить сериал по ID',
    description: 'Возвращает полную информацию о сериале, включая все эпизоды и загруженные медиа',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Сериал найден' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал не найден' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.seriesService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: './uploads/covers',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `cover-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Редактировать сериал',
    description: 'Обновляет информацию о сериале. Все поля опциональны. Можно обновить обложку и количество бесплатных эпизодов.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Название сериала' },
        description: { type: 'string', description: 'Описание сериала' },
        price: { type: 'number', description: 'Цена в коронах' },
        isVisible: { type: 'boolean', description: 'Видимость в мини-приложении' },
        freeEpisodesCount: { type: 'number', description: 'Количество бесплатных эпизодов (первые N эпизодов будут доступны без покупки)', minimum: 0 },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Новая обложка сериала (опционально)',
        },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Сериал успешно обновлен' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал не найден' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateSeriesDto: UpdateSeriesDto,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    // Нормализуем путь: делаем относительным от корня проекта
    const normalizedPath = cover?.path
      ? (cover.path.startsWith(process.cwd())
          ? cover.path.replace(process.cwd() + '/', '')
          : cover.path.replace(/^\.\//, ''))
      : undefined;
    return this.seriesService.update(id, updateSeriesDto, normalizedPath);
  }

  @Put(':id/toggle-visibility')
  @ApiOperation({
    summary: 'Переключить видимость сериала',
    description: 'Изменяет видимость сериала в мини-приложении. По умолчанию все новые сериалы скрыты.',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Видимость успешно изменена' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал не найден' })
  async toggleVisibility(@Param('id', ParseObjectIdPipe) id: string) {
    return this.seriesService.toggleVisibility(id);
  }

  @Post(':id/episodes')
  @ApiOperation({
    summary: 'Добавить новую серию',
    description: 'Создает новую серию в сериале. Возвращает первую комбинацию озвучки/субтитров для загрузки.',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({
    status: 201,
    description: 'Серия создана. Возвращает следующую комбинацию для загрузки.',
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID или серия с таким номером уже существует' })
  @ApiResponse({ status: 404, description: 'Сериал не найден' })
  async addEpisode(@Param('id', ParseObjectIdPipe) id: string, @Body() addEpisodeDto: AddEpisodeDto) {
    const result = await this.seriesService.addEpisode(id, addEpisodeDto.episodeNumber);
    return {
      success: true,
      message: `Episode ${addEpisodeDto.episodeNumber} created. Please upload the first media file.`,
      seriesId: result.series._id,
      episodeNumber: addEpisodeDto.episodeNumber,
      nextStep: {
        message: `Please upload video with ${result.firstCombination.audio} audio and ${result.firstCombination.subtitle} subtitles`,
        audio: result.firstCombination.audio,
        subtitle: result.firstCombination.subtitle,
      },
    };
  }

  @Post(':id/episodes/upload')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: './uploads/episodes',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `episode-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiOperation({
    summary: 'Загрузить медиа для серии',
    description: `Загружает видеофайл с определенной комбинацией озвучки и субтитров. 
    Всего требуется загрузить 12 комбинаций для каждой серии в следующем порядке:
    1. Русская озвучка без субтитров
    2. Русская озвучка + русские субтитры
    3. Русская озвучка + английские субтитры
    4. Русская озвучка + португальские субтитры
    5. Русская озвучка + субтитры хинди
    6. Русская озвучка + турецкие субтитры
    7. Английская озвучка без субтитров
    8. Английская озвучка + англ субтитры
    9. Английская озвучка + русские субтитры
    10. Английская озвучка + португальские субтитры
    11. Английская озвучка + субтитры хинди
    12. Английская озвучка + турецкие субтитры
    
    После каждой загрузки возвращается следующая требуемая комбинация. Когда все 12 комбинаций загружены, серия помечается как завершенная.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        episodeNumber: { type: 'number', description: 'Номер серии', example: 1 },
        audioLanguage: {
          type: 'string',
          enum: ['russian', 'english'],
          description: 'Язык озвучки',
          example: 'russian',
        },
        subtitleLanguage: {
          type: 'string',
          enum: ['russian', 'english', 'portuguese', 'hindi', 'turkish', 'none'],
          description: 'Язык субтитров',
          example: 'russian',
        },
        video: {
          type: 'string',
          format: 'binary',
          description: 'Видеофайл серии (макс. 500MB)',
        },
      },
      required: ['episodeNumber', 'audioLanguage', 'subtitleLanguage', 'video'],
    },
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({
    status: 201,
    description: 'Медиа успешно загружено. Возвращает информацию о следующей требуемой комбинации или сообщение о завершении.',
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID или такая комбинация уже загружена или неверные данные' })
  @ApiResponse({ status: 404, description: 'Сериал или серия не найдены' })
  async uploadEpisodeMedia(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() uploadDto: UploadEpisodeMediaDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1024 }), // 1GB
        ],
      }),
    )
    video: Express.Multer.File,
  ) {
    // Нормализуем путь: делаем относительным от корня проекта
    const normalizedPath = video.path.startsWith(process.cwd())
      ? video.path.replace(process.cwd() + '/', '')
      : video.path.replace(/^\.\//, '');
    const result = await this.seriesService.uploadEpisodeMedia(id, uploadDto, normalizedPath);
    
    // Формируем понятный ответ для бота
    const response: any = {
      success: true,
      message: 'Media uploaded successfully',
      seriesId: result.series._id,
      episodeNumber: uploadDto.episodeNumber,
      uploaded: {
        audio: uploadDto.audioLanguage,
        subtitle: uploadDto.subtitleLanguage,
      },
    };

    if (result.nextCombination) {
      response.nextStep = {
        message: `Please upload video with ${result.nextCombination.audio} audio and ${result.nextCombination.subtitle} subtitles`,
        audio: result.nextCombination.audio,
        subtitle: result.nextCombination.subtitle,
      };
    } else {
      response.message = 'Episode is complete! All media combinations uploaded.';
      response.complete = true;
    }

    return response;
  }

  @Get(':id/episodes/:episodeNumber/progress')
  @ApiOperation({
    summary: 'Получить прогресс загрузки серии',
    description: 'Возвращает список загруженных и оставшихся комбинаций озвучки/субтитров для серии',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiParam({ name: 'episodeNumber', description: 'Номер серии', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Прогресс загрузки серии',
    type: EpisodeProgressResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал или серия не найдены' })
  async getEpisodeProgress(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('episodeNumber', ParseIntPipe) episodeNumber: number,
  ) {
    return this.seriesService.getEpisodeProgress(id, episodeNumber);
  }

  @Delete(':id/episodes/:episodeNumber')
  @ApiOperation({
    summary: 'Удалить эпизод сериала',
    description: 'Удаляет конкретный эпизод из сериала. Внимание: операция необратима! Все загруженные медиа для этого эпизода будут удалены.',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiParam({ name: 'episodeNumber', description: 'Номер эпизода для удаления', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Эпизод успешно удален',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Episode 1 deleted successfully' },
        series: { type: 'object', description: 'Обновленный сериал' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал или эпизод не найдены' })
  async deleteEpisode(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('episodeNumber', ParseIntPipe) episodeNumber: number,
  ) {
    const series = await this.seriesService.deleteEpisode(id, episodeNumber);
    return {
      success: true,
      message: `Episode ${episodeNumber} deleted successfully`,
      series,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить сериал',
    description: 'Удаляет сериал и все связанные данные. Внимание: операция необратима!',
  })
  @ApiParam({ name: 'id', description: 'ID сериала (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Сериал успешно удален' })
  @ApiResponse({ status: 400, description: 'Неверный формат ID (должен быть валидный MongoDB ObjectId)' })
  @ApiResponse({ status: 404, description: 'Сериал не найден' })
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.seriesService.delete(id);
  }
}
