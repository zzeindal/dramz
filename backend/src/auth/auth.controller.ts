import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Вход в админ-панель',
    description: 'Аутентификация администратора по логину и паролю. Возвращает JWT токен для доступа к админским endpoints.',
  })
  @ApiBody({
    type: LoginDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная аутентификация',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT токен для доступа к админским endpoints',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        admin: {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'admin' },
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создать нового администратора',
    description: 'Создает нового администратора. Требует аутентификации (JWT токен).',
  })
  @ApiBody({
    type: CreateAdminDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Администратор успешно создан',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Admin created successfully' },
        admin: {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'admin' },
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован или админ с таким логином уже существует' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.createAdmin(createAdminDto);
  }
}

