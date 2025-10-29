import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, TicketsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
