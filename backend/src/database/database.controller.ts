import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MigrationService } from './migration.service';
import { BackupService } from './backup.service';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { DeleteBackupDto } from './dto/delete-backup.dto';

@Controller('admin/database')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DatabaseController {
  constructor(
    private migrationService: MigrationService,
    private backupService: BackupService,
  ) {}

  @Get('migration-status')
  async getMigrationStatus() {
    return this.migrationService.getMigrationStatus();
  }

  @Post('migrate')
  @HttpCode(HttpStatus.OK)
  async applyMigrations() {
    return this.migrationService.applyPendingMigrations();
  }

  @Get('validate-schema')
  async validateSchema() {
    return this.migrationService.validateSchema();
  }

  @Get('info')
  async getDatabaseInfo() {
    return this.migrationService.getDatabaseInfo();
  }

  @Post('backup')
  @HttpCode(HttpStatus.CREATED)
  async createBackup() {
    return this.backupService.createBackup();
  }

  @Get('backups')
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  async restoreBackup(@Body() restoreBackupDto: RestoreBackupDto) {
    return this.backupService.restoreBackup(restoreBackupDto.filename);
  }

  @Delete('backup')
  @HttpCode(HttpStatus.OK)
  async deleteBackup(@Body() deleteBackupDto: DeleteBackupDto) {
    return this.backupService.deleteBackup(deleteBackupDto.filename);
  }
}
