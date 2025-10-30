import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSecretsService implements OnModuleInit {
  private readonly logger = new Logger(AwsSecretsService.name);
  private secretsCache: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Only load secrets if DB_SECRET_ARN is configured (i.e., running in AWS)
    const secretArn = this.configService.get<string>('DB_SECRET_ARN');
    if (secretArn) {
      this.logger.log('AWS Secrets Manager integration enabled');
      await this.loadDatabaseSecrets();
    } else {
      this.logger.log('Using local environment variables (AWS Secrets Manager not configured)');
    }
  }

  async loadDatabaseSecrets(): Promise<void> {
    try {
      const secretArn = this.configService.get<string>('DB_SECRET_ARN');
      if (!secretArn) {
        return;
      }

      // Dynamic import to avoid bundling AWS SDK in local dev
      const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      
      const client = new SecretsManagerClient({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      });

      const command = new GetSecretValueCommand({
        SecretId: secretArn,
      });

      const response = await client.send(command);
      if (response.SecretString) {
        const secrets = JSON.parse(response.SecretString);
        this.secretsCache.set('database', secrets);
        this.logger.log('Database secrets loaded from AWS Secrets Manager');
      }
    } catch (error) {
      this.logger.error('Failed to load secrets from AWS Secrets Manager', error);
      throw error;
    }
  }

  getDatabaseUrl(): string {
    const secrets = this.secretsCache.get('database');
    if (secrets) {
      // Construct DATABASE_URL from secrets
      return `postgresql://${secrets.username}:${secrets.password}@${secrets.host}:${secrets.port}/${secrets.dbname}?schema=public`;
    }
    
    // Fallback to environment variable
    return this.configService.get<string>('DATABASE_URL', '');
  }

  getDatabaseCredentials() {
    return this.secretsCache.get('database');
  }
}
