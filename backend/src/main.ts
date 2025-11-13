import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || '/api';
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Start server
  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log('');
  console.log('========================================');
  console.log('🚀 Jellyfin Anime Backend is running!');
  console.log('========================================');
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`🔗 API: http://localhost:${port}${apiPrefix}`);
  console.log(`🎌 Frontend: ${frontendUrl}`);
  console.log('========================================');
  console.log('');
}

bootstrap();
