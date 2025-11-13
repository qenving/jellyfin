import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);

    // Set HTTP-only cookie
    this.setAuthCookie(res, result.token);

    // Remove token from response body (karena sudah di cookie)
    delete result.token;

    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    // Set HTTP-only cookie
    this.setAuthCookie(res, result.token);

    // Remove token from response body
    delete result.token;

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth-token', {
      httpOnly: true,
      secure: this.configService.get('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
      domain: this.configService.get('COOKIE_DOMAIN'),
    });

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    const userData = await this.authService.validateUser(user.userId);
    return {
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        avatarUrl: userData.avatarUrl,
        isAdmin: userData.isAdmin,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const newToken = await this.authService.refreshToken(user.userId);
    this.setAuthCookie(res, newToken);
    return { message: 'Token refreshed' };
  }

  private setAuthCookie(res: Response, token: string) {
    const expiresIn = this.configService.get('JWT_EXPIRES_IN') || '7d';
    const expiresInMs = this.parseExpiresIn(expiresIn);

    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: this.configService.get('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
      maxAge: expiresInMs,
      domain: this.configService.get('COOKIE_DOMAIN'),
    });
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000; // default 7 days
    }
  }
}
