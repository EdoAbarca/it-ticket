import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [AuthModule, TicketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
