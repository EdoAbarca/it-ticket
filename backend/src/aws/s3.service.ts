import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: any;
  private bucketName: string;
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME', '');
    this.isConfigured = !!this.bucketName;
  }

  async initialize() {
    if (!this.isConfigured) {
      this.logger.warn('S3 not configured, file operations will use local storage');
      return;
    }

    try {
      // Dynamic import to avoid bundling AWS SDK in local dev
      const { S3Client } = await import('@aws-sdk/client-s3');
      
      this.s3Client = new S3Client({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      });

      this.logger.log(`S3 service initialized with bucket: ${this.bucketName}`);
    } catch (error) {
      this.logger.error('Failed to initialize S3 client', error);
      throw error;
    }
  }

  async uploadFile(key: string, body: Buffer, contentType?: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('S3 is not configured');
    }

    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      
      const url = `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION', 'us-east-1')}.amazonaws.com/${key}`;
      this.logger.log(`File uploaded to S3: ${key}`);
      
      return url;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${key}`, error);
      throw error;
    }
  }

  async getFile(key: string): Promise<Buffer> {
    if (!this.isConfigured) {
      throw new Error('S3 is not configured');
    }

    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as any;
      
      // Convert stream to buffer
      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Failed to get file from S3: ${key}`, error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('S3 is not configured');
    }

    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${key}`, error);
      throw error;
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    if (!this.isConfigured) {
      throw new Error('S3 is not configured');
    }

    try {
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);
      return response.Contents?.map(obj => obj.Key || '') || [];
    } catch (error) {
      this.logger.error('Failed to list files from S3', error);
      throw error;
    }
  }

  isS3Configured(): boolean {
    return this.isConfigured;
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
