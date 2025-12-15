import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(username: string, password: string): Promise<AdminDocument | null> {
    const admin = await this.adminModel.findOne({ username, isActive: true }).exec();
    if (!admin) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    // Обновляем дату последнего входа
    admin.lastLoginAt = new Date();
    await admin.save();

    return admin;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; admin: { username: string; id: string } }> {
    const admin = await this.validateAdmin(loginDto.username, loginDto.password);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: admin.username, sub: admin._id.toString() };
    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        username: admin.username,
        id: admin._id.toString(),
      },
    };
  }

  async createAdmin(createAdminDto: CreateAdminDto): Promise<{ success: boolean; message: string; admin: { username: string; id: string } }> {
    // Проверяем, существует ли уже админ с таким логином
    const existingAdmin = await this.adminModel.findOne({ username: createAdminDto.username }).exec();
    if (existingAdmin) {
      throw new UnauthorizedException('Admin with this username already exists');
    }

    const admin = new this.adminModel({
      username: createAdminDto.username,
      password: createAdminDto.password, // Пароль будет автоматически захеширован в pre-save hook
      isActive: true,
    });

    await admin.save();

    return {
      success: true,
      message: 'Admin created successfully',
      admin: {
        username: admin.username,
        id: admin._id.toString(),
      },
    };
  }

  async findAdminById(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findById(id).exec();
  }
}

