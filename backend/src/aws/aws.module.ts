import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsSecretsService } from './aws-secrets.service';
import { S3Service } from './s3.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AwsSecretsService, S3Service],
  exports: [AwsSecretsService, S3Service],
})
export class AwsModule {}
