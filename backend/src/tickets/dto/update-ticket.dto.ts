import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Priority } from '@prisma/client';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Priority, {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  priority?: Priority;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
