import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

describe('MonitoringController', () => {
  let controller: MonitoringController;
  let service: MonitoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [
        {
          provide: MonitoringService,
          useValue: {
            getHealthCheck: jest.fn(),
            getMetrics: jest.fn(),
            getLogs: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MonitoringController>(MonitoringController);
    service = module.get<MonitoringService>(MonitoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health check result', async () => {
      const mockHealthCheck = {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        uptime: 100,
        version: '1.0.0',
        checks: {
          database: {
            status: 'healthy' as const,
            responseTime: 10,
          },
          memory: {
            status: 'healthy' as const,
            used: 1000000,
            total: 10000000,
            percentage: 10,
          },
        },
      };

      const spy = jest
        .spyOn(service, 'getHealthCheck')
        .mockResolvedValue(mockHealthCheck);

      const result = await controller.getHealth();

      expect(result).toEqual(mockHealthCheck);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should handle unhealthy status', async () => {
      const mockHealthCheck = {
        status: 'unhealthy' as const,
        timestamp: new Date().toISOString(),
        uptime: 100,
        version: '1.0.0',
        checks: {
          database: {
            status: 'unhealthy' as const,
            error: 'Database connection failed',
          },
          memory: {
            status: 'healthy' as const,
            used: 1000000,
            total: 10000000,
            percentage: 10,
          },
        },
      };

      jest.spyOn(service, 'getHealthCheck').mockResolvedValue(mockHealthCheck);

      const result = await controller.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('unhealthy');
    });
  });

  describe('getMetrics', () => {
    it('should return application metrics', () => {
      const mockMetrics = {
        timestamp: new Date().toISOString(),
        uptime: 100,
        memory: {
          heapUsed: 1000000,
          heapTotal: 10000000,
          rss: 20000000,
          external: 100000,
        },
        process: {
          cpuUsage: {
            user: 500000,
            system: 200000,
          },
          pid: 1234,
        },
      };

      const spy = jest
        .spyOn(service, 'getMetrics')
        .mockReturnValue(mockMetrics);

      const result = controller.getMetrics();

      expect(result).toEqual(mockMetrics);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLogs', () => {
    it('should return logs with default parameters', () => {
      const mockLogs: any[] = [];

      const spy = jest.spyOn(service, 'getLogs').mockReturnValue(mockLogs);

      const result = controller.getLogs();

      expect(result).toEqual(mockLogs);
      expect(spy).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should return logs with custom limit', () => {
      const mockLogs: any[] = [];

      const spy = jest.spyOn(service, 'getLogs').mockReturnValue(mockLogs);

      const result = controller.getLogs(50);

      expect(result).toEqual(mockLogs);
      expect(spy).toHaveBeenCalledWith(50, undefined);
    });

    it('should return logs with custom level', () => {
      const mockLogs: any[] = [];

      const spy = jest.spyOn(service, 'getLogs').mockReturnValue(mockLogs);

      const result = controller.getLogs(100, 'error');

      expect(result).toEqual(mockLogs);
      expect(spy).toHaveBeenCalledWith(100, 'error');
    });
  });
});
