import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private prisma: PrismaService) {}

  async getMigrationStatus() {
    try {
      const { stdout } = await execAsync('npx prisma migrate status', {
        cwd: process.cwd(),
      });
      return {
        status: 'success',
        output: stdout,
      };
    } catch (error) {
      this.logger.error('Failed to get migration status', error.stack);
      throw new Error('Failed to get migration status');
    }
  }

  async applyPendingMigrations() {
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        cwd: process.cwd(),
      });
      this.logger.log('Migrations applied successfully');
      return {
        status: 'success',
        output: stdout || stderr,
      };
    } catch (error) {
      this.logger.error('Failed to apply migrations', error.stack);
      throw new Error('Failed to apply migrations');
    }
  }

  async validateSchema() {
    try {
      const { stdout } = await execAsync('npx prisma validate', {
        cwd: process.cwd(),
      });
      return {
        valid: true,
        output: stdout,
      };
    } catch (error) {
      this.logger.error('Schema validation failed', error.stack);
      return {
        valid: false,
        output: error.message,
      };
    }
  }

  async getDatabaseInfo() {
    try {
      const result = await this.prisma.$queryRaw<
        Array<{ version: string }>
      >`SELECT version()`;

      const tables = await this.prisma.$queryRaw<
        Array<{ tablename: string }>
      >`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;

      return {
        version: result[0]?.version || 'Unknown',
        tables: tables.map((t) => t.tablename),
        tableCount: tables.length,
      };
    } catch (error) {
      this.logger.error('Failed to get database info', error.stack);
      throw new Error('Failed to get database info');
    }
  }
}
