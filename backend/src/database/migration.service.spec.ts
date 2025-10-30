const mockExecAsync = jest.fn();

jest.mock('child_process');
jest.mock('util', () => ({
  promisify: () => mockExecAsync,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { MigrationService } from './migration.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MigrationService', () => {
  let service: MigrationService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
    mockExecAsync.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMigrationStatus', () => {
    it('should get migration status successfully', async () => {
      const mockOutput = 'Database schema is up to date!';
      mockExecAsync.mockResolvedValue({ stdout: mockOutput });

      const result = await service.getMigrationStatus();

      expect(result).toEqual({
        status: 'success',
        output: mockOutput,
      });
    });

    it('should throw error if migration status check fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command failed'));

      await expect(service.getMigrationStatus()).rejects.toThrow(
        'Failed to get migration status',
      );
    });
  });

  describe('applyPendingMigrations', () => {
    it('should apply migrations successfully', async () => {
      const mockOutput = 'Migrations applied successfully';
      mockExecAsync.mockResolvedValue({ stdout: mockOutput, stderr: '' });

      const result = await service.applyPendingMigrations();

      expect(result).toEqual({
        status: 'success',
        output: mockOutput,
      });
    });

    it('should throw error if migration fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Migration failed'));

      await expect(service.applyPendingMigrations()).rejects.toThrow(
        'Failed to apply migrations',
      );
    });
  });

  describe('validateSchema', () => {
    it('should validate schema successfully', async () => {
      const mockOutput = 'The schema is valid';
      mockExecAsync.mockResolvedValue({ stdout: mockOutput });

      const result = await service.validateSchema();

      expect(result).toEqual({
        valid: true,
        output: mockOutput,
      });
    });

    it('should return invalid if schema validation fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Schema is invalid'));

      const result = await service.validateSchema();

      expect(result).toEqual({
        valid: false,
        output: 'Schema is invalid',
      });
    });
  });

  describe('getDatabaseInfo', () => {
    it('should get database info successfully', async () => {
      const mockVersion = [{ version: 'PostgreSQL 13.0' }];
      const mockTables = [
        { tablename: 'User' },
        { tablename: 'Ticket' },
        { tablename: 'Comment' },
      ];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockVersion)
        .mockResolvedValueOnce(mockTables);

      const result = await service.getDatabaseInfo();

      expect(result).toEqual({
        version: 'PostgreSQL 13.0',
        tables: ['User', 'Ticket', 'Comment'],
        tableCount: 3,
      });
    });

    it('should throw error if database info query fails', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Query failed'));

      await expect(service.getDatabaseInfo()).rejects.toThrow(
        'Failed to get database info',
      );
    });
  });
});
