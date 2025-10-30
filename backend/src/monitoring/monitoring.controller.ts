import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  async getHealth() {
    return this.monitoringService.getHealthCheck();
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getLogs(@Query('limit') limit?: number, @Query('level') level?: string) {
    return this.monitoringService.getLogs(limit, level);
  }
}
