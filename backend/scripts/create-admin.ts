import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  try {
    const result = await authService.createAdmin({
      username: 'admin',
      password: 'password123',
    });

    console.log('✅ Администратор успешно создан!');
    console.log('Username:', result.admin.username);
    console.log('ID:', result.admin.id);
    console.log('\nТеперь вы можете войти в админ-панель:');
    console.log('POST /auth/login');
    console.log('Body: { "username": "admin", "password": "password123" }');
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('⚠️  Администратор с логином "admin" уже существует');
    } else {
      console.error('❌ Ошибка при создании администратора:', error.message);
    }
  }

  await app.close();
}

bootstrap();

