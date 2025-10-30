import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { MigrationService } from './migration.service';
import { BackupService } from './backup.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DatabaseController],
  providers: [MigrationService, BackupService, PrismaService],
  exports: [MigrationService, BackupService],
})
export class DatabaseModule {}
