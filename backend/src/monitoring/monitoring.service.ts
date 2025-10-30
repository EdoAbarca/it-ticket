import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export interface MetricsResult {
  timestamp: string;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  process: {
    cpuUsage: {
      user: number;
      system: number;
    };
    pid: number;
  };
}

@Injectable()
export class MonitoringService {
  private startTime: number = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = (Date.now() - this.startTime) / 1000; // in seconds

    // Check database health
    const databaseCheck = await this.checkDatabaseHealth();

    // Check memory health
    const memoryCheck = this.checkMemoryHealth();

    const overallStatus =
      databaseCheck.status === 'healthy' && memoryCheck.status === 'healthy'
        ? 'healthy'
        : 'unhealthy';

    return {
      status: overallStatus,
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
      },
    };
  }

  private async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkMemoryHealth(): {
    status: 'healthy' | 'unhealthy';
    used: number;
    total: number;
    percentage: number;
  } {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    // Consider unhealthy if memory usage is above 90%
    const status = percentage > 90 ? 'unhealthy' : 'healthy';

    return {
      status,
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  getMetrics(): MetricsResult {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - this.startTime) / 1000,
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
      },
      process: {
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        pid: process.pid,
      },
    };
  }

  getLogs(_limit = 100, _level?: string): any[] {
    // This is a simple in-memory log retrieval
    // In production, you'd integrate with a proper logging service
    return [];
  }
}
