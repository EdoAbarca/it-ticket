import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsEnum(Priority, {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  priority: Priority;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
