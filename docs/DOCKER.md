# Docker Containerization Guide

## Overview

This application is fully containerized using Docker and Docker Compose for local development. The single `docker-compose.yml` file is optimized for the development workflow with hot-reload support and live code updates.

## Architecture

The application consists of three main services configured for local development:

1. **PostgreSQL Database** - Stores application data
2. **Backend API** - NestJS application with hot-reload for development
3. **Frontend** - React application with Vite dev server for instant updates

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose V2.0+
- At least 2GB of available RAM
- Available ports: 3000 (backend), 5173 (frontend), 5432 (database)

## Quick Start

### 1. Environment Setup

Copy the environment example files and configure as needed:

```bash
# Root directory environment
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env

# Frontend environment  
cp frontend/.env.example frontend/.env
```

### 2. Configure Environment Variables

Edit the `.env` files with your specific configuration:

**Root `.env`:**
```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=appdb
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# App Ports
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

**Backend `backend/.env`:**
```env
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public
JWT_SECRET=your_secure_jwt_secret_here
PORT=3000

# Email Configuration (optional)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com

# Frontend URL for password reset links
FRONTEND_URL=http://localhost:5173
```

**Frontend `frontend/.env`:**
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=IT Ticket System
```

### 3. Build and Run

Using Make (recommended):
```bash
make up
```

Or using Docker Compose directly:
```bash
docker compose up -d --build
```

The services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database: localhost:5432

## Docker Compose Services

### PostgreSQL Service
- **Image**: postgres:13
- **Container Name**: postgres
- **Port**: 5432 (mapped from ${POSTGRES_PORT})
- **Volume**: pgdata (persistent database storage)
- **Health Check**: Validates database connection every 10s

### Backend Service
- **Build**: ./backend (builder stage for development)
- **Container Name**: backend
- **Port**: 3000 (mapped from ${BACKEND_PORT})
- **Depends On**: postgres (with health check)
- **Health Check**: HTTP GET /health every 30s
- **Features**:
  - Hot-reload support with volume mounts
  - Automatic database migration on startup
  - Waits for database to be ready
  - Development mode with `npm run start:dev`
  - Multi-stage build

### Frontend Service
- **Build**: ./frontend (build stage for development)
- **Container Name**: frontend
- **Port**: 5173 (mapped from ${FRONTEND_PORT}) - Vite dev server
- **Depends On**: backend (with health check)
- **Health Check**: HTTP GET / every 30s
- **Features**:
  - Hot-reload support with volume mounts
  - Vite dev server for instant updates
  - Live code changes without rebuild
  - Development mode with `npm run dev`

## Docker Files

### Frontend Dockerfile

Multi-stage build for both development and production:
1. **Base Stage**: Installs dependencies and copies source code
2. **Development Stage**: Runs Vite dev server for hot-reload (used by docker-compose.yml)
3. **Build Stage**: Builds the React application for production
4. **Production Stage**: Serves static files using Nginx

Key features:
- Uses Node 20 Alpine for smaller image size
- `.dockerignore` excludes unnecessary files
- Development stage with Vite dev server on port 5173
- Production stage with Nginx for optimized serving
- Health check endpoint

### Backend Dockerfile

Multi-stage build for both development and production:
1. **Base Stage**: Installs dependencies and generates Prisma client
2. **Development Stage**: Runs NestJS in watch mode for hot-reload (used by docker-compose.yml)
3. **Builder Stage**: Compiles TypeScript for production
4. **Production Stage**: Runs the application with only production dependencies

Key features:
- Uses Node 20 Alpine for smaller image size
- Prisma client generated at build time
- Development stage with `npm run start:dev`
- Production stage with only production dependencies
- Docker entrypoint script handles database migrations
- Health check endpoint

### Docker Entrypoint Script

The backend uses a custom entrypoint script (`docker-entrypoint.sh`) that:
1. Waits for PostgreSQL to be ready (max 60 seconds)
2. Runs Prisma migrations automatically
3. Starts the NestJS application

## Makefile Commands

Convenient commands for managing the Docker environment:

```bash
# Start all services (build and run in background)
make up

# Stop all services
make down

# View logs (follow mode)
make logs

# Access backend container shell
make backend-shell

# Access frontend container shell
make frontend-shell

# Access database shell
make db-shell

# Restart all services (rebuild)
make restart
```

## Health Checks

All services implement health checks for better reliability:

### PostgreSQL
- Command: `pg_isready`
- Interval: 10s
- Timeout: 5s
- Retries: 5

### Backend
- Endpoint: GET /health
- Interval: 30s
- Timeout: 10s
- Retries: 3
- Start Period: 40s (allows time for migrations)

### Frontend
- Endpoint: GET /
- Interval: 30s
- Timeout: 10s
- Retries: 3

## Network Configuration

Services communicate via Docker's internal network:
- Frontend → Backend: `http://backend:3000`
- Backend → Database: `postgres:5432`

External access:
- Frontend: `http://localhost:${FRONTEND_PORT}`
- Backend: `http://localhost:${BACKEND_PORT}`
- Database: `localhost:${POSTGRES_PORT}`

## Volumes

### pgdata Volume
- Persists PostgreSQL data across container restarts
- Located in Docker's volume storage
- Can be backed up using `docker volume` commands

To backup the database:
```bash
docker exec postgres pg_dump -U postgres appdb > backup.sql
```

To restore:
```bash
docker exec -i postgres psql -U postgres appdb < backup.sql
```

## Production Deployment

**Note**: This Docker Compose configuration is optimized for local development. For production deployments, this project uses AWS infrastructure automation with Terraform and ECS Fargate. See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for production deployment instructions.

### Security Considerations for Local Development

1. **Environment Variables**: Never commit `.env` files with sensitive data
2. **JWT Secret**: Use a strong, random secret
3. **Database Password**: Use a strong password
4. **Network Access**: The development configuration exposes ports for local access

### AWS Production Deployment

For production, the application is deployed to AWS using:
- ECS Fargate for serverless container orchestration
- RDS for managed PostgreSQL database
- Application Load Balancer for traffic distribution
- CloudWatch for monitoring and logging
- Terraform for infrastructure as code

Refer to [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for complete production deployment documentation.

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose logs -f

# Check service health
docker compose ps
```

### Database connection issues
```bash
# Verify database is healthy
docker exec postgres pg_isready -U postgres

# Check database logs
docker compose logs postgres
```

### Build failures
```bash
# Clean build (remove cache)
docker compose build --no-cache

# Remove all containers and volumes (WARNING: deletes data)
docker compose down -v
```

### Network timeouts during build
If you encounter network timeouts while building:
1. Check your internet connection
2. Check DNS settings
3. Configure Docker to use different DNS servers
4. Use a proxy if behind a corporate firewall

### Port already in use
```bash
# Find what's using the port
lsof -i :3000

# Change the port in .env file
BACKEND_PORT=3001
```

## Development Workflow

### Hot Reload (Built-in)

The Docker Compose configuration includes hot-reload support for both backend and frontend:

**Backend**: 
- Source code changes in `backend/src/` are automatically detected
- NestJS restarts the application when files change
- No rebuild required during development

**Frontend**:
- Source code changes in `frontend/src/` are automatically detected
- Vite dev server provides instant hot module replacement (HMR)
- Changes appear in browser immediately

### Local Development without Docker

For development outside of Docker (e.g., for debugging):

```bash
# Backend (in backend directory)
npm install
npm run start:dev

# Frontend (in frontend directory)  
npm install
npm run dev
```

### Hybrid Approach

Run only the database in Docker:
```bash
docker compose up -d postgres
```

Then run backend and frontend locally with connection to the containerized database.

## CI/CD Integration

The containerization setup is CI/CD ready:

```yaml
# Example GitHub Actions workflow
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker images
        run: docker compose build
      - name: Run tests
        run: docker compose run backend npm test
```

## Image Optimization

Current optimizations:
- Multi-stage builds reduce final image size
- Alpine Linux base images (~5MB vs 130MB for full Node images)
- `.dockerignore` files prevent unnecessary file copying
- Production dependencies only in final images
- Layer caching for faster rebuilds

## Monitoring

### Container Stats
```bash
# View resource usage
docker stats

# View specific container
docker stats backend
```

### Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

## Scaling

To run multiple instances:
```bash
# Scale backend to 3 instances
docker compose up -d --scale backend=3

# Note: You'll need to configure a load balancer
```

## Maintenance

### Cleaning Up

Remove unused Docker resources:
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove all unused resources
docker system prune -a
```

### Updates

To update the application:
```bash
git pull
docker compose down
docker compose up -d --build
```

## Support

For issues related to:
- **Docker**: Check Docker documentation
- **Application**: See main README.md
- **Database**: Check PostgreSQL logs

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [React Deployment](https://create-react-app.dev/docs/deployment/)
