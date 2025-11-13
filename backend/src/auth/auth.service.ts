import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JellyfinService } from '../jellyfin/jellyfin.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jellyfinService: JellyfinService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === dto.username) {
        throw new ConflictException('Username already taken');
      }
      if (existingUser.email === dto.email) {
        throw new ConflictException('Email already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      // Create user in Jellyfin
      const jellyfinUser = await this.jellyfinService.createUser({
        Name: dto.username,
        Password: dto.password,
      });

      // Authenticate with Jellyfin to get token
      const jellyfinAuth = await this.jellyfinService.authenticateUser(
        dto.username,
        dto.password,
      );

      // Create user in our database
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: hashedPassword,
          jellyfinUserId: jellyfinUser.Id,
          jellyfinToken: jellyfinAuth.AccessToken,
          displayName: dto.username,
          isActive: true,
          isAdmin: false,
        },
      });

      // Create default user preferences
      await this.prisma.userPreferences.create({
        data: {
          userId: user.id,
        },
      });

      this.logger.log(`User registered successfully: ${user.username}`);

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
        token,
      };
    } catch (error) {
      this.logger.error('Registration failed', error);

      // Rollback: If Jellyfin user was created but our DB failed, we should ideally delete the Jellyfin user
      // For now, just throw the error
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Registration failed. Username might already exist in Jellyfin.');
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.usernameOrEmail },
          { email: dto.usernameOrEmail },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      // Authenticate with Jellyfin to get fresh token
      const jellyfinAuth = await this.jellyfinService.authenticateUser(
        user.username,
        dto.password,
      );

      // Update Jellyfin token in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          jellyfinToken: jellyfinAuth.AccessToken,
          lastLoginAt: new Date(),
        },
      });

      user.jellyfinToken = jellyfinAuth.AccessToken;

      this.logger.log(`User logged in: ${user.username}`);

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
        token,
      };
    } catch (error) {
      this.logger.error('Login failed', error);
      throw new UnauthorizedException('Authentication failed with Jellyfin');
    }
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        isAdmin: true,
        jellyfinUserId: true,
        jellyfinToken: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      jellyfinUserId: user.jellyfinUserId,
      jellyfinToken: user.jellyfinToken,
    };

    return this.jwtService.sign(payload);
  }

  async refreshToken(userId: string): Promise<string> {
    const user = await this.validateUser(userId);
    return this.generateToken(user);
  }
}
