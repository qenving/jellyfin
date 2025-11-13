import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);

  // Initialize Sentry
  const sentryDsn = configService.get('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [new ProfilingIntegration()],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      environment: configService.get('NODE_ENV') || 'development',
    });
  }

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
