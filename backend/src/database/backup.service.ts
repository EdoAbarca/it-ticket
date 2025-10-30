import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = process.env.BACKUP_DIR || '/tmp/backups';

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not configured');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbUser = url.username;
      const dbPassword = url.password;
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbName = url.pathname.substring(1).split('?')[0];

      // Use pg_dump to create backup
      const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f ${filepath}`;

      await execAsync(command);

      const stats = fs.statSync(filepath);
      this.logger.log(`Backup created successfully: ${filename}`);

      return {
        status: 'success',
        filename,
        filepath,
        size: stats.size,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to create backup', error.stack);
      throw new Error('Failed to create backup');
    }
  }

  async listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return { backups: [] };
      }

      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter((file) => file.endsWith('.sql'))
        .map((file) => {
          const filepath = path.join(this.backupDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            filepath,
            size: stats.size,
            created: stats.mtime,
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return { backups };
    } catch (error) {
      this.logger.error('Failed to list backups', error.stack);
      throw new Error('Failed to list backups');
    }
  }

  async restoreBackup(filename: string) {
    const filepath = path.join(this.backupDir, filename);

    try {
      if (!fs.existsSync(filepath)) {
        throw new Error('Backup file not found');
      }

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not configured');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbUser = url.username;
      const dbPassword = url.password;
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbName = url.pathname.substring(1).split('?')[0];

      // Use psql to restore backup
      const command = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${filepath}`;

      await execAsync(command);

      this.logger.log(`Backup restored successfully: ${filename}`);

      return {
        status: 'success',
        filename,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to restore backup', error.stack);
      throw new Error('Failed to restore backup');
    }
  }

  async deleteBackup(filename: string) {
    const filepath = path.join(this.backupDir, filename);

    try {
      if (!fs.existsSync(filepath)) {
        throw new Error('Backup file not found');
      }

      fs.unlinkSync(filepath);
      this.logger.log(`Backup deleted successfully: ${filename}`);

      return {
        status: 'success',
        filename,
      };
    } catch (error) {
      this.logger.error('Failed to delete backup', error.stack);
      throw new Error('Failed to delete backup');
    }
  }
}
