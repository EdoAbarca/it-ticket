import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringService } from './monitoring.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MonitoringService', () => {
  let service: MonitoringService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoringService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MonitoringService>(MonitoringService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthCheck', () => {
    it('should return healthy status when all checks pass', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealthCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('memory');
    });

    it('should return healthy status when database is healthy', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.checks.database.status).toBe('healthy');
      expect(result.checks.database).toHaveProperty('responseTime');
    });

    it('should return unhealthy status when database is down', async () => {
      jest
        .spyOn(prisma, '$queryRaw')
        .mockRejectedValue(new Error('Database connection failed'));

      const result = await service.getHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('unhealthy');
      expect(result.checks.database.error).toBe('Database connection failed');
    });

    it('should check memory health', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealthCheck();

      expect(result.checks.memory.status).toBeDefined();
      expect(result.checks.memory.used).toBeGreaterThan(0);
      expect(result.checks.memory.total).toBeGreaterThan(0);
      expect(result.checks.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.checks.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should include version and uptime', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealthCheck();

      expect(result.version).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include ISO timestamp', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealthCheck();

      expect(result.timestamp).toBeDefined();
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return application metrics', () => {
      const result = service.getMetrics();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('process');
    });

    it('should include memory metrics', () => {
      const result = service.getMetrics();

      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('external');
      expect(result.memory.heapUsed).toBeGreaterThan(0);
      expect(result.memory.heapTotal).toBeGreaterThan(0);
    });

    it('should include process metrics', () => {
      const result = service.getMetrics();

      expect(result.process).toHaveProperty('cpuUsage');
      expect(result.process).toHaveProperty('pid');
      expect(result.process.cpuUsage).toHaveProperty('user');
      expect(result.process.cpuUsage).toHaveProperty('system');
      expect(result.process.pid).toBeGreaterThan(0);
    });

    it('should return ISO timestamp', () => {
      const result = service.getMetrics();

      expect(result.timestamp).toBeDefined();
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    it('should track uptime', () => {
      const result = service.getMetrics();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLogs', () => {
    it('should return empty array by default', () => {
      const result = service.getLogs();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should accept limit parameter', () => {
      const result = service.getLogs(50);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept level parameter', () => {
      const result = service.getLogs(100, 'error');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
