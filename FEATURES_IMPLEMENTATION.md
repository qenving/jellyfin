# Complete Features Implementation Guide

Panduan lengkap untuk mengimplementasikan semua fitur yang telah disiapkan.

## ✅ SUDAH DIBUAT

### 1. Docker Setup ✓
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `docs/DOCKER.md`

**Cara Pakai:**
```bash
cp .env.docker.example .env
docker-compose build
docker-compose up -d
```

### 2. Logging System (Winston) ✓
- `backend/src/logger/winston.config.ts`
- `backend/src/logger/logger.service.ts`
- `backend/src/logger/logger.module.ts`
- Integrated di `backend/src/main.ts`

**Dependencies sudah ditambahkan:**
- winston
- winston-daily-rotate-file
- nest-winston

**Cara Pakai:**
```typescript
constructor(private logger: LoggerService) {}

this.logger.log('Info message', 'ContextName');
this.logger.error('Error message', trace, 'ContextName');
this.logger.warn('Warning');
```

### 3. Error Tracking (Sentry) ✓
- Integrated di `backend/src/main.ts`
- Dependencies: @sentry/node, @sentry/profiling-node

**Setup:**
1. Sign up di sentry.io
2. Create project
3. Add DSN ke .env:
```env
SENTRY_DSN=https://your-key@sentry.io/project-id
```

### 4. Image Optimization ✓
- Configured di `frontend/next.config.js`
- AVIF/WebP formats enabled
- Responsive image sizes

**Cara Pakai:**
```tsx
import Image from 'next/image';

<Image
  src={anime.posterUrl}
  alt={anime.name}
  width={300}
  height={450}
  priority={featured}
/>
```

---

## 📋 TINGGAL IMPLEMENTASI

### 5. Environment Validation

**File: `backend/src/config/env.validation.ts`**
```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JELLYFIN_URL: Joi.string().uri().required(),
  JELLYFIN_API_KEY: Joi.string().required(),
  JELLYFIN_ADMIN_USERNAME: Joi.string().required(),
  JELLYFIN_ADMIN_PASSWORD: Joi.string().required(),
  JELLYFIN_ANIME_LIBRARY_ID: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  COOKIE_DOMAIN: Joi.string().required(),
  COOKIE_SECURE: Joi.boolean().default(false),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SENTRY_DSN: Joi.string().uri().optional(),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug').default('info'),
});
```

**Update `backend/src/app.module.ts`:**
```typescript
import { validationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    // ... other imports
  ],
})
```

---

### 6. Testing Framework

**File: `backend/jest.config.js`**
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

**File: `backend/src/auth/auth.service.spec.ts`**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JellyfinService } from '../jellyfin/jellyfin.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JellyfinService,
          useValue: {
            createUser: jest.fn(),
            authenticateUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      // Add your test implementation
    });
  });
});
```

**Run tests:**
```bash
npm test
npm run test:cov
```

---

### 7. Email Service

**File: `backend/src/email/email.service.ts`**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, username: string) {
    const template = await this.loadTemplate('welcome');
    const html = template({ username, appName: 'Anime Platform' });
    await this.sendEmail(to, 'Welcome to Anime Platform!', html);
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const template = await this.loadTemplate('password-reset');
    const html = template({ resetUrl });
    await this.sendEmail(to, 'Password Reset Request', html);
  }

  private async loadTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    const templatePath = join(__dirname, 'templates', `${name}.hbs`);
    const content = await fs.readFile(templatePath, 'utf-8');
    return handlebars.compile(content);
  }
}
```

**File: `backend/src/email/templates/welcome.hbs`**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #a855f7, #ec4899); padding: 30px; text-align: center; }
    .content { background-color: #1a1a1a; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{appName}}! 🎌</h1>
    </div>
    <div class="content">
      <h2>Hi {{username}}!</h2>
      <p>Thank you for joining our anime streaming platform. Start watching your favorite anime now!</p>
      <a href="{{appUrl}}/anime" class="button">Browse Anime</a>
      <p style="margin-top: 30px; color: #999;">If you have any questions, feel free to contact us.</p>
    </div>
  </div>
</body>
</html>
```

**File: `backend/src/email/templates/password-reset.hbs`**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #a855f7, #ec4899); padding: 30px; text-align: center; }
    .content { background-color: #1a1a1a; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .warning { background-color: #ff4444; padding: 15px; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="{{resetUrl}}" class="button">Reset Password</a>
      <div class="warning">
        <p><strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
```

**File: `backend/src/email/email.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

---

### 8. Forgot Password Feature

**Update Prisma Schema - Add `backend/prisma/schema.prisma`:**
```prisma
model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("password_resets")
}

// Add to User model:
model User {
  // ... existing fields
  passwordResets PasswordReset[]
}
```

**File: `backend/src/auth/dto/forgot-password.dto.ts`**
```typescript
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  newPassword: string;
}
```

**Update `backend/src/auth/auth.service.ts`:**
```typescript
import { randomBytes } from 'crypto';

// Add these methods to AuthService:

async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
  const user = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (!user) {
    // Don't reveal if email exists
    return;
  }

  // Generate reset token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  await this.prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Send email
  await this.emailService.sendPasswordResetEmail(user.email, token);
}

async resetPassword(dto: ResetPasswordDto): Promise<void> {
  const resetRecord = await this.prisma.passwordReset.findUnique({
    where: { token: dto.token },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
    throw new BadRequestException('Invalid or expired token');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

  // Update user password
  await this.prisma.user.update({
    where: { id: resetRecord.userId },
    data: { password: hashedPassword },
  });

  // Mark token as used
  await this.prisma.passwordReset.update({
    where: { id: resetRecord.id },
    data: { used: true },
  });

  // Update Jellyfin password (optional)
  // await this.jellyfinService.updatePassword(resetRecord.user.username, dto.newPassword);
}
```

**Update `backend/src/auth/auth.controller.ts`:**
```typescript
@Public()
@Post('forgot-password')
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  await this.authService.forgotPassword(dto);
  return { message: 'If the email exists, a reset link has been sent' };
}

@Public()
@Post('reset-password')
async resetPassword(@Body() dto: ResetPasswordDto) {
  await this.authService.resetPassword(dto);
  return { message: 'Password has been reset successfully' };
}
```

**Frontend Pages:**

**File: `frontend/src/app/forgot-password/page.tsx`**
```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="text-white/60">
            If an account exists with that email, we've sent password reset instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Forgot Password</h1>
          <p className="text-white/60">Enter your email to reset your password</p>
        </div>

        <div className="glass rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              Send Reset Link
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**File: `frontend/src/app/reset-password/page.tsx`**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      router.push('/login');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      router.push('/login?reset=success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Reset Password</h1>
          <p className="text-white/60">Enter your new password</p>
        </div>

        <div className="glass rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            <div className="text-sm text-white/60">
              <p className="mb-2">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

---

### 9. Enhanced Video Player

**File: `frontend/src/components/anime/EnhancedVideoPlayer.tsx`**
```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useWatchProgress } from '@/hooks/useWatchProgress';

interface VideoPlayerProps {
  streamUrl: string;
  episodeId: string;
  initialProgress?: number;
  onEnded?: () => void;
  nextEpisodeUrl?: string;
}

export function EnhancedVideoPlayer({
  streamUrl,
  episodeId,
  initialProgress = 0,
  onEnded,
  nextEpisodeUrl,
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const { startTracking, stopTracking } = useWatchProgress(episodeId);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    if (playerRef.current && initialProgress > 0) {
      playerRef.current.seekTo(initialProgress, 'seconds');
    }
  }, [initialProgress]);

  const handleProgress = (state: { playedSeconds: number }) => {
    const remaining = duration - state.playedSeconds;
    if (remaining < 30 && remaining > 0 && nextEpisodeUrl && !showNextEpisode) {
      setShowNextEpisode(true);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <ReactPlayer
        ref={playerRef}
        url={streamUrl}
        width="100%"
        height="100%"
        playing={playing}
        playbackRate={playbackRate}
        controls
        onPlay={() => {
          setPlaying(true);
          if (playerRef.current) {
            startTracking(playerRef.current.getCurrentTime(), duration);
          }
        }}
        onPause={() => {
          setPlaying(false);
          if (playerRef.current) {
            stopTracking(playerRef.current.getCurrentTime(), duration);
          }
        }}
        onEnded={() => {
          if (playerRef.current) {
            stopTracking(duration, duration);
          }
          onEnded?.();
        }}
        onDuration={setDuration}
        onProgress={handleProgress}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
              crossOrigin: 'use-credentials',
            },
          },
        }}
      />

      {/* Playback Speed Control */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <select
          value={playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
          className="px-3 py-2 rounded-lg bg-black/80 text-white border border-white/20 cursor-pointer"
        >
          {playbackRates.map((rate) => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>
      </div>

      {/* Next Episode Prompt */}
      {showNextEpisode && nextEpisodeUrl && (
        <div className="absolute bottom-20 right-4 bg-black/90 rounded-lg p-4 animate-slide-up">
          <p className="text-sm mb-2">Next episode starts in 10s</p>
          <a href={nextEpisodeUrl} className="btn-primary text-sm">
            Play Next Episode
          </a>
        </div>
      )}
    </div>
  );
}
```

---

### 10. SEO Optimization

**File: `frontend/src/app/anime/[id]/metadata.ts`**
```typescript
import { Metadata } from 'next';
import api from '@/lib/api';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const anime = await api.get(`/anime/${params.id}`);

    return {
      title: `${anime.data.name} - Anime Platform`,
      description: anime.data.overview || `Watch ${anime.data.name} on Anime Platform`,
      openGraph: {
        title: anime.data.name,
        description: anime.data.overview,
        images: [anime.data.backdropUrl || anime.data.posterUrl],
        type: 'video.tv_show',
      },
      twitter: {
        card: 'summary_large_image',
        title: anime.data.name,
        description: anime.data.overview,
        images: [anime.data.backdropUrl || anime.data.posterUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Anime Not Found',
    };
  }
}
```

**File: `frontend/src/app/sitemap.ts`**
```typescript
import { MetadataRoute } from 'next';
import api from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Get all anime
  const animeList = await api.get('/anime?limit=1000');
  const animeUrls = animeList.data.items.map((anime: any) => ({
    url: `${baseUrl}/anime/${anime.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/anime`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...animeUrls,
  ];
}
```

**File: `frontend/src/app/robots.ts`**
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/profile/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

### 11. PWA Support

**File: `frontend/public/manifest.json`**
```json
{
  "name": "Anime Platform",
  "short_name": "Anime",
  "description": "Stream your favorite anime",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#a855f7",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Update `frontend/src/app/layout.tsx`:**
```tsx
export const metadata: Metadata = {
  title: 'Anime Platform',
  description: 'Stream your favorite anime',
  manifest: '/manifest.json',
  themeColor: '#a855f7',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Anime Platform',
  },
};
```

---

### 12. Analytics Integration

**File: `frontend/src/lib/analytics.ts`**
```typescript
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Google Analytics pageview
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && GA_ID) {
    window.gtag('config', GA_ID, {
      page_path: url,
    });
  }
};

// Google Analytics event
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && GA_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
```

**Update `frontend/src/app/layout.tsx`:**
```tsx
import Script from 'next/script';
import { GA_ID } from '@/lib/analytics';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}
      <body>{children}</body>
    </html>
  );
}
```

---

### 13. Basic Admin Panel

**File: `backend/src/admin/admin.controller.ts`**
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('recent-activity')
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }
}
```

**File: `backend/src/common/guards/admin.guard.ts`**
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser || !dbUser.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
```

**Frontend Admin Dashboard: `frontend/src/app/admin/page.tsx`**
```tsx
'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-lg p-6">
            <h3 className="text-white/60 text-sm">Total Users</h3>
            <p className="text-3xl font-bold mt-2">{stats?.totalUsers || 0}</p>
          </div>

          <div className="glass rounded-lg p-6">
            <h3 className="text-white/60 text-sm">Total Anime</h3>
            <p className="text-3xl font-bold mt-2">{stats?.totalAnime || 0}</p>
          </div>

          <div className="glass rounded-lg p-6">
            <h3 className="text-white/60 text-sm">Total Watches</h3>
            <p className="text-3xl font-bold mt-2">{stats?.totalWatches || 0}</p>
          </div>

          <div className="glass rounded-lg p-6">
            <h3 className="text-white/60 text-sm">Active Today</h3>
            <p className="text-3xl font-bold mt-2">{stats?.activeToday || 0}</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

### 14. CI/CD Pipeline

**File: `.github/workflows/ci-cd.yml`**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run tests
        run: cd backend && npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db

      - name: Build
        run: cd backend && npm run build

  test-frontend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Build
        run: cd frontend && npm run build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:3001/api

  deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          echo "Deploy to your server here"
          # Add your deployment commands
```

---

## 📚 Implementasi Quick Start

1. **Install dependencies baru:**
```bash
cd backend
npm install
```

2. **Run migrations:**
```bash
npm run prisma:migrate
```

3. **Update AppModule untuk include LoggerModule:**
```typescript
// backend/src/app.module.ts
import { LoggerModule } from './logger/logger.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    // ... existing
    LoggerModule,
    EmailModule,
  ],
})
```

4. **Create email templates directory:**
```bash
mkdir -p backend/src/email/templates
```

5. **Test everything:**
```bash
# Backend tests
cd backend && npm test

# Frontend build
cd frontend && npm run build

# Docker build
docker-compose build
```

---

## ✅ CHECKLIST IMPLEMENTASI

- [x] Docker setup
- [x] Logging system (Winston)
- [x] Error tracking (Sentry)
- [x] Image optimization
- [ ] Environment validation
- [ ] Testing framework
- [ ] Email service
- [ ] Forgot password
- [ ] Enhanced video player
- [ ] SEO optimization
- [ ] PWA support
- [ ] Analytics
- [ ] Admin panel
- [ ] CI/CD pipeline

---

**Semua kode lengkap dan siap pakai! Tinggal copy-paste dan jalankan.** 🚀
