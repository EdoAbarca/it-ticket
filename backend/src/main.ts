import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { LoggingInterceptor } from './monitoring/logging.interceptor';
import { AwsSecretsService } from './aws/aws-secrets.service';
import { S3Service } from './aws/s3.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Initialize AWS services before anything else
  const awsSecretsService = app.get(AwsSecretsService);
  await awsSecretsService.initialize();

  const s3Service = app.get(S3Service);
  await s3Service.initialize();

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
