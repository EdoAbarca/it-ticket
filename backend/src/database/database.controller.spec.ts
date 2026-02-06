import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseController } from './database.controller';
import { MigrationService } from './migration.service';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

describe('DatabaseController', () => {
  let controller: DatabaseController;

  const mockMigrationService = {
    getMigrationStatus: jest.fn(),
    applyPendingMigrations: jest.fn(),
    validateSchema: jest.fn(),
    getDatabaseInfo: jest.fn(),
  };

  const mockBackupService = {
    createBackup: jest.fn(),
    listBackups: jest.fn(),
    restoreBackup: jest.fn(),
    deleteBackup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseController],
      providers: [
        {
          provide: MigrationService,
          useValue: mockMigrationService,
        },
        {
          provide: BackupService,
          useValue: mockBackupService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DatabaseController>(DatabaseController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMigrationStatus', () => {
    it('should return migration status', async () => {
      const mockStatus = {
        status: 'success',
        output: 'All migrations applied',
      };
      mockMigrationService.getMigrationStatus.mockResolvedValue(mockStatus);

      const result = await controller.getMigrationStatus();

      expect(result).toEqual(mockStatus);
      expect(mockMigrationService.getMigrationStatus).toHaveBeenCalled();
    });
  });

  describe('applyMigrations', () => {
    it('should apply pending migrations', async () => {
      const mockResult = {
        status: 'success',
        output: 'Migrations applied',
      };
      mockMigrationService.applyPendingMigrations.mockResolvedValue(mockResult);

      const result = await controller.applyMigrations();

      expect(result).toEqual(mockResult);
      expect(mockMigrationService.applyPendingMigrations).toHaveBeenCalled();
    });
  });

  describe('validateSchema', () => {
    it('should validate database schema', async () => {
      const mockResult = {
        valid: true,
        output: 'Schema is valid',
      };
      mockMigrationService.validateSchema.mockResolvedValue(mockResult);

      const result = await controller.validateSchema();

      expect(result).toEqual(mockResult);
      expect(mockMigrationService.validateSchema).toHaveBeenCalled();
    });
  });

  describe('getDatabaseInfo', () => {
    it('should return database information', async () => {
      const mockInfo = {
        version: 'PostgreSQL 13.0',
        tables: ['User', 'Ticket'],
        tableCount: 2,
      };
      mockMigrationService.getDatabaseInfo.mockResolvedValue(mockInfo);

      const result = await controller.getDatabaseInfo();

      expect(result).toEqual(mockInfo);
      expect(mockMigrationService.getDatabaseInfo).toHaveBeenCalled();
    });
  });

  describe('createBackup', () => {
    it('should create a database backup', async () => {
      const mockBackup = {
        status: 'success',
        filename: 'backup_2023-01-01.sql',
        filepath: '/tmp/backups/backup_2023-01-01.sql',
        size: 1024,
        timestamp: new Date(),
      };
      mockBackupService.createBackup.mockResolvedValue(mockBackup);

      const result = await controller.createBackup();

      expect(result).toEqual(mockBackup);
      expect(mockBackupService.createBackup).toHaveBeenCalled();
    });
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      const mockBackups = {
        backups: [
          {
            filename: 'backup_2023-01-01.sql',
            filepath: '/tmp/backups/backup_2023-01-01.sql',
            size: 1024,
            created: new Date(),
          },
        ],
      };
      mockBackupService.listBackups.mockResolvedValue(mockBackups);

      const result = await controller.listBackups();

      expect(result).toEqual(mockBackups);
      expect(mockBackupService.listBackups).toHaveBeenCalled();
    });
  });

  describe('restoreBackup', () => {
    it('should restore a backup', async () => {
      const dto = { filename: 'backup_2023-01-01.sql' };
      const mockResult = {
        status: 'success',
        filename: dto.filename,
        timestamp: new Date(),
      };
      mockBackupService.restoreBackup.mockResolvedValue(mockResult);

      const result = await controller.restoreBackup(dto);

      expect(result).toEqual(mockResult);
      expect(mockBackupService.restoreBackup).toHaveBeenCalledWith(
        dto.filename,
      );
    });
  });

  describe('deleteBackup', () => {
    it('should delete a backup', async () => {
      const dto = { filename: 'backup_2023-01-01.sql' };
      const mockResult = {
        status: 'success',
        filename: dto.filename,
      };
      mockBackupService.deleteBackup.mockResolvedValue(mockResult);

      const result = await controller.deleteBackup(dto);

      expect(result).toEqual(mockResult);
      expect(mockBackupService.deleteBackup).toHaveBeenCalledWith(dto.filename);
    });
  });
});
