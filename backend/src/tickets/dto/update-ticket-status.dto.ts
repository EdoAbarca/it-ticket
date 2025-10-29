import { IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateTicketStatusDto {
  @IsEnum(Status, {
    message: 'Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED',
  })
  status: Status;
}
