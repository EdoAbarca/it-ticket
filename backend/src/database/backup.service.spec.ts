const mockExecAsync = jest.fn();

jest.mock('fs');
jest.mock('child_process');
jest.mock('util', () => ({
  promisify: () => mockExecAsync,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from './backup.service';
import * as fs from 'fs';

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(async () => {
    process.env.DATABASE_URL =
      'postgresql://user:password@localhost:5432/testdb';
    process.env.BACKUP_DIR = '/tmp/test-backups';

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    mockExecAsync.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BackupService],
    }).compile();

    service = module.get<BackupService>(BackupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      const mockStats = {
        size: 1024,
      };

      mockExecAsync.mockResolvedValue({ stdout: 'Backup created' });
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const result = await service.createBackup();

      expect(result.status).toBe('success');
      expect(result.filename).toMatch(/^backup_.*\.sql$/);
      expect(result.size).toBe(1024);
    });

    it('should throw error if DATABASE_URL is not configured', async () => {
      delete process.env.DATABASE_URL;

      await expect(service.createBackup()).rejects.toThrow(
        'Failed to create backup',
      );

      process.env.DATABASE_URL =
        'postgresql://user:password@localhost:5432/testdb';
    });

    it('should throw error if backup command fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('pg_dump failed'));

      await expect(service.createBackup()).rejects.toThrow(
        'Failed to create backup',
      );
    });
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      const mockFiles = ['backup_2023-01-01.sql', 'backup_2023-01-02.sql'];
      const mockStats = {
        size: 1024,
        mtime: new Date('2023-01-01'),
      };

      (fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
      (fs.statSync as jest.Mock).mockReturnValue(mockStats);

      const result = await service.listBackups();

      expect(result.backups).toHaveLength(2);
      expect(result.backups[0].filename).toBe('backup_2023-01-01.sql');
    });

    it('should return empty array if backup directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.listBackups();

      expect(result.backups).toEqual([]);
    });

    it('should throw error if listing fails', async () => {
      (fs.readdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to read directory');
      });

      await expect(service.listBackups()).rejects.toThrow(
        'Failed to list backups',
      );
    });
  });

  describe('restoreBackup', () => {
    it('should restore a backup successfully', async () => {
      const filename = 'backup_2023-01-01.sql';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockExecAsync.mockResolvedValue({ stdout: 'Restore successful' });

      const result = await service.restoreBackup(filename);

      expect(result.status).toBe('success');
      expect(result.filename).toBe(filename);
    });

    it('should throw error if backup file not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.restoreBackup('nonexistent.sql')).rejects.toThrow(
        'Failed to restore backup',
      );
    });

    it('should throw error if restore command fails', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockExecAsync.mockRejectedValue(new Error('psql failed'));

      await expect(
        service.restoreBackup('backup_2023-01-01.sql'),
      ).rejects.toThrow('Failed to restore backup');
    });
  });

  describe('deleteBackup', () => {
    it('should delete a backup successfully', async () => {
      const filename = 'backup_2023-01-01.sql';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      const result = await service.deleteBackup(filename);

      expect(result.status).toBe('success');
      expect(result.filename).toBe(filename);
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should throw error if backup file not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.deleteBackup('nonexistent.sql')).rejects.toThrow(
        'Failed to delete backup',
      );
    });

    it('should throw error if delete fails', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to delete');
      });

      await expect(
        service.deleteBackup('backup_2023-01-01.sql'),
      ).rejects.toThrow('Failed to delete backup');
    });
  });
});
