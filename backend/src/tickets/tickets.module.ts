import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { AdminTicketsController } from './admin-tickets.controller';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TicketsController, AdminTicketsController],
  providers: [TicketsService, PrismaService, EmailService],
})
export class TicketsModule {}
