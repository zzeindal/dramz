import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { json, urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const uploadDirs = [
    join(process.cwd(), 'uploads', 'covers'),
    join(process.cwd(), 'uploads', 'episodes'),
  ];
  
  uploadDirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  })

  app.use(json({ limit: '1gb' }))
  app.use(urlencoded({ extended: true, limit: '1gb' }))

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  }
  app.enableCors(corsOptions)
  const config = new DocumentBuilder()
    .setTitle('DRAMZ Admin API')
    .setDescription('API для админ-панели мини-приложения Telegram. Управление сериалами, пользователями, FAQ и статистикой.')
    .setVersion('1.0')
    .addTag('series', 'Управление сериалами')
    .addTag('users', 'Управление пользователями')
    .addTag('statistics', 'Статистика')
    .addTag('faq', 'Управление FAQ')
    .addTag('faq-public', 'FAQ для пользователей')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'DRAMZ API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();

