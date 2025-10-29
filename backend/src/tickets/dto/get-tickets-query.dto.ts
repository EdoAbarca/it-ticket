import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Priority, Status } from '@prisma/client';

export enum SortBy {
  CREATED_AT = 'createdAt',
  PRIORITY = 'priority',
  STATUS = 'status',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetTicketsQueryDto {
  @IsOptional()
  @IsEnum(SortBy, {
    message: 'Sort by must be one of: createdAt, priority, status',
  })
  sortBy?: SortBy = SortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'Sort order must be one of: asc, desc',
  })
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsEnum(Status, {
    message: 'Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED',
  })
  status?: Status;

  @IsOptional()
  @IsEnum(Priority, {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  priority?: Priority;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
