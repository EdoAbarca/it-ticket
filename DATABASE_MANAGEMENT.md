# Database Management

This document provides comprehensive information about the database management features in the IT Ticket Management System, including database migrations and backup/restore capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Migration Management](#migration-management)
- [Backup Management](#backup-management)
- [Security](#security)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Database Management module provides DevOps engineers with tools to:
- Monitor and apply database schema migrations
- Create and manage database backups
- Restore databases from backups
- Validate database schema integrity
- Get database information and statistics

All database management endpoints are protected and require admin authentication.

## Features

### Migration Management
- **Migration Status**: Check the current state of database migrations
- **Apply Migrations**: Apply pending migrations to the database
- **Schema Validation**: Validate the Prisma schema for correctness
- **Database Info**: Get PostgreSQL version and table information

### Backup Management
- **Create Backups**: Generate timestamped database backups
- **List Backups**: View all available backup files
- **Restore Backups**: Restore the database from a backup file
- **Delete Backups**: Remove old or unnecessary backup files

## API Endpoints

All endpoints are prefixed with `/admin/database` and require JWT authentication with admin privileges.

### Migration Endpoints

#### Get Migration Status
```http
GET /admin/database/migration-status
```

**Response:**
```json
{
  "status": "success",
  "output": "Database schema is up to date!\n\nDatabase schema is up to date.\n\nNo pending migrations to deploy."
}
```

#### Apply Pending Migrations
```http
POST /admin/database/migrate
```

**Response:**
```json
{
  "status": "success",
  "output": "The following migrations have been applied:\n\nmigrations/\n  └─ 20251029144018_init"
}
```

#### Validate Schema
```http
GET /admin/database/validate-schema
```

**Response:**
```json
{
  "valid": true,
  "output": "The schema at prisma/schema.prisma is valid 🚀"
}
```

#### Get Database Info
```http
GET /admin/database/info
```

**Response:**
```json
{
  "version": "PostgreSQL 13.0 on x86_64-pc-linux-gnu",
  "tables": [
    "User",
    "PasswordResetToken",
    "Ticket",
    "TicketStatusHistory",
    "Comment",
    "Notification",
    "_prisma_migrations"
  ],
  "tableCount": 7
}
```

### Backup Endpoints

#### Create Backup
```http
POST /admin/database/backup
```

**Response:**
```json
{
  "status": "success",
  "filename": "backup_2023-10-30T15-30-00-000Z.sql",
  "filepath": "/tmp/backups/backup_2023-10-30T15-30-00-000Z.sql",
  "size": 4096,
  "timestamp": "2023-10-30T15:30:00.000Z"
}
```

#### List Backups
```http
GET /admin/database/backups
```

**Response:**
```json
{
  "backups": [
    {
      "filename": "backup_2023-10-30T15-30-00-000Z.sql",
      "filepath": "/tmp/backups/backup_2023-10-30T15-30-00-000Z.sql",
      "size": 4096,
      "created": "2023-10-30T15:30:00.000Z"
    },
    {
      "filename": "backup_2023-10-29T10-00-00-000Z.sql",
      "filepath": "/tmp/backups/backup_2023-10-29T10-00-00-000Z.sql",
      "size": 3584,
      "created": "2023-10-29T10:00:00.000Z"
    }
  ]
}
```

#### Restore Backup
```http
POST /admin/database/restore
Content-Type: application/json

{
  "filename": "backup_2023-10-30T15-30-00-000Z.sql"
}
```

**Response:**
```json
{
  "status": "success",
  "filename": "backup_2023-10-30T15-30-00-000Z.sql",
  "timestamp": "2023-10-30T16:00:00.000Z"
}
```

#### Delete Backup
```http
DELETE /admin/database/backup
Content-Type: application/json

{
  "filename": "backup_2023-10-29T10-00-00-000Z.sql"
}
```

**Response:**
```json
{
  "status": "success",
  "filename": "backup_2023-10-29T10-00-00-000Z.sql"
}
```

## Migration Management

### Checking Migration Status

Before applying migrations, it's recommended to check the status:

```bash
curl -X GET http://localhost:3000/admin/database/migration-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Applying Migrations

To apply pending migrations in production:

```bash
curl -X POST http://localhost:3000/admin/database/migrate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Important Notes:**
- Always backup your database before applying migrations
- Migrations are automatically applied during development using `prisma migrate dev`
- In production, use `prisma migrate deploy` (which this endpoint uses)
- The endpoint uses the same mechanism as the Makefile's `migrate` target

### Schema Validation

Validate your Prisma schema before creating migrations:

```bash
curl -X GET http://localhost:3000/admin/database/validate-schema \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Backup Management

### Creating Backups

#### Manual Backup via API
```bash
curl -X POST http://localhost:3000/admin/database/backup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Using Makefile
```bash
make backup
```

This creates a timestamped backup file in the format `backup_YYYYMMDD_HHMMSS.sql`.

### Listing Available Backups

```bash
curl -X GET http://localhost:3000/admin/database/backups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Restoring from Backup

**⚠️ WARNING**: Restoring a backup will overwrite the current database. Ensure you have a recent backup before proceeding.

#### Via API
```bash
curl -X POST http://localhost:3000/admin/database/restore \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup_2023-10-30T15-30-00-000Z.sql"}'
```

#### Using Makefile
```bash
make restore FILE=backup_2023-10-30T15-30-00-000Z.sql
```

### Deleting Old Backups

```bash
curl -X DELETE http://localhost:3000/admin/database/backup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup_2023-10-29T10-00-00-000Z.sql"}'
```

## Security

### Authentication & Authorization

All database management endpoints are protected by two guards:

1. **JWT Authentication Guard**: Ensures the user is logged in
2. **Admin Guard**: Ensures the user has admin privileges

Only users with `isAdmin: true` can access these endpoints.

### Access Control

```typescript
@Controller('admin/database')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DatabaseController {
  // All endpoints require admin authentication
}
```

### Security Best Practices

1. **Restrict Access**: Only grant admin privileges to trusted DevOps personnel
2. **Audit Logs**: Monitor access to backup and migration endpoints
3. **Secure Backups**: Store backup files in a secure location with restricted access
4. **Regular Backups**: Implement automated backup schedules
5. **Test Restores**: Regularly test backup restoration in a non-production environment

## Configuration

### Environment Variables

Configure the backup directory using environment variables:

```env
# Backend .env file
DATABASE_URL=postgresql://user:password@host:5432/dbname
BACKUP_DIR=/path/to/backups  # Optional, defaults to /tmp/backups
```

### Backup Directory

By default, backups are stored in `/tmp/backups`. To change this:

1. Set the `BACKUP_DIR` environment variable
2. Ensure the directory exists and has write permissions
3. Consider using a persistent volume for Docker deployments

### Docker Configuration

For Docker deployments, mount a volume for backups:

```yaml
services:
  backend:
    volumes:
      - backup-data:/app/backups
    environment:
      - BACKUP_DIR=/app/backups

volumes:
  backup-data:
```

## Usage Examples

### Complete Backup and Migration Workflow

#### 1. Check Current State
```bash
# Get database info
curl -X GET http://localhost:3000/admin/database/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check migration status
curl -X GET http://localhost:3000/admin/database/migration-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Create Backup Before Changes
```bash
curl -X POST http://localhost:3000/admin/database/backup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Apply Migrations
```bash
curl -X POST http://localhost:3000/admin/database/migrate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Verify Changes
```bash
# Check migration status again
curl -X GET http://localhost:3000/admin/database/migration-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify database info
curl -X GET http://localhost:3000/admin/database/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Automated Backup Script

Create a cron job for regular backups:

```bash
#!/bin/bash
# backup-database.sh

JWT_TOKEN="your-admin-jwt-token"
API_URL="http://localhost:3000"

# Create backup
RESPONSE=$(curl -s -X POST "$API_URL/admin/database/backup" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Backup created: $RESPONSE"

# Keep only last 7 days of backups
BACKUPS=$(curl -s -X GET "$API_URL/admin/database/backups" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq -r '.backups[7:] | .[].filename')

for backup in $BACKUPS; do
  curl -X DELETE "$API_URL/admin/database/backup" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"filename\": \"$backup\"}"
  echo "Deleted old backup: $backup"
done
```

Add to crontab:
```bash
# Backup database daily at 2 AM
0 2 * * * /path/to/backup-database.sh >> /var/log/backup.log 2>&1
```

## Troubleshooting

### Common Issues

#### 1. Permission Denied

**Error:** `Failed to create backup` or `Failed to restore backup`

**Solution:**
- Check file system permissions on the backup directory
- Ensure PostgreSQL user has necessary permissions
- Verify `BACKUP_DIR` is writable

#### 2. Database Connection Issues

**Error:** `Failed to get database info`

**Solution:**
- Verify `DATABASE_URL` is correctly configured
- Check PostgreSQL service is running
- Ensure network connectivity to database

#### 3. Migration Failures

**Error:** `Failed to apply migrations`

**Solution:**
- Check Prisma schema for syntax errors
- Validate schema using `/admin/database/validate-schema`
- Review migration files in `prisma/migrations/`
- Ensure database is accessible
- Check for conflicting schema changes

#### 4. Backup File Not Found

**Error:** `Backup file not found`

**Solution:**
- Verify the filename is correct
- Check backups using `/admin/database/backups`
- Ensure backup directory path is correct

#### 5. Unauthorized Access

**Error:** `403 Forbidden` or `Access denied`

**Solution:**
- Verify JWT token is valid and not expired
- Ensure user has admin privileges (`isAdmin: true`)
- Check authentication headers are correctly set

### Debugging

Enable debug logging for the database module:

```typescript
// In migration.service.ts or backup.service.ts
private readonly logger = new Logger(MigrationService.name);

// Logs are automatically output to console
```

View logs in Docker:
```bash
docker compose logs -f backend
```

### Health Checks

Monitor database health:

```bash
# Check if database is accessible
docker compose exec postgres pg_isready -U postgres

# View database connections
docker compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check disk space for backups
df -h /path/to/backup/directory
```

## Integration with Existing Tools

### Makefile Commands

The database management API complements existing Makefile commands:

```bash
make migrate      # Equivalent to POST /admin/database/migrate
make backup       # Similar to POST /admin/database/backup
make restore      # Similar to POST /admin/database/restore
```

### Prisma CLI

Direct Prisma commands (for development):

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Best Practices

1. **Always Backup Before Migrations**: Create a backup before applying any schema changes
2. **Test in Staging First**: Apply migrations to a staging environment before production
3. **Regular Backups**: Implement automated daily backups
4. **Retention Policy**: Keep backups for at least 7-30 days based on your requirements
5. **Monitor Disk Space**: Regularly check backup directory disk usage
6. **Verify Backups**: Periodically test backup restoration in a separate environment
7. **Document Changes**: Keep track of migration purposes and backup creation reasons
8. **Use Version Control**: Commit migration files to git
9. **Audit Trail**: Log all database management operations
10. **Disaster Recovery Plan**: Document the backup and restore procedures for your team

## Related Documentation

- [README.md](./README.md) - General project documentation
- [DOCKER.md](./DOCKER.md) - Docker deployment guide
- [Prisma Documentation](https://www.prisma.io/docs) - Official Prisma documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - PostgreSQL reference

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs: `docker compose logs -f backend`
3. Open an issue in the repository with relevant logs and error messages
