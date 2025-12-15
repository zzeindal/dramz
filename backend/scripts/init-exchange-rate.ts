import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExchangeRateService } from '../src/users/exchange-rate.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const exchangeRateService = app.get(ExchangeRateService);

  try {
    // Проверяем, есть ли уже активный курс
    const existingRate = await exchangeRateService.getCurrentRate();
    
    if (existingRate && existingRate.isActive) {
      console.log('✅ Активный курс уже существует:');
      console.log(`1 корона = ${existingRate.rubPerCrown} RUB`);
      console.log(`1 корона = ${existingRate.usdPerCrown} USD`);
      console.log(`1 корона = ${existingRate.telegramStarPerCrown} Telegram Stars`);
    } else {
      // Создаем дефолтный курс
      const rate = await exchangeRateService.updateRate({
        rubPerCrown: 1,
        usdPerCrown: 0.01,
        telegramStarPerCrown: 1,
      }, 'system');
      
      console.log('✅ Курс корон успешно инициализирован!');
      console.log(`1 корона = ${rate.rubPerCrown} RUB`);
      console.log(`1 корона = ${rate.usdPerCrown} USD`);
      console.log(`1 корона = ${rate.telegramStarPerCrown} Telegram Stars`);
    }
  } catch (error) {
    console.error('❌ Ошибка при инициализации курса:', error.message);
  }

  await app.close();
}

bootstrap();

