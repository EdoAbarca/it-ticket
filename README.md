# IT Ticket Management System

[![CI](https://github.com/EdoAbarca/it-ticket/actions/workflows/ci.yml/badge.svg)](https://github.com/EdoAbarca/it-ticket/actions/workflows/ci.yml)
[![Security Scanning](https://github.com/EdoAbarca/it-ticket/actions/workflows/security.yml/badge.svg)](https://github.com/EdoAbarca/it-ticket/actions/workflows/security.yml)
[![Docker Build](https://github.com/EdoAbarca/it-ticket/actions/workflows/docker.yml/badge.svg)](https://github.com/EdoAbarca/it-ticket/actions/workflows/docker.yml)

A modern, full-stack IT ticket management system built with React, NestJS, and PostgreSQL. Fully containerized with Docker for easy deployment.

## Features

- 🎫 **Ticket Management**: Create, view, and manage IT support tickets
- 👥 **User Management**: Admin capabilities for user administration
- 💬 **Comments**: Add comments to tickets for better communication
- 🔔 **Notifications**: Real-time in-app notifications for admins
- 🔐 **Authentication**: Secure JWT-based authentication
- 📊 **Admin Dashboard**: Comprehensive ticket and user management
- 🗄️ **Database Management**: Migration and backup management for DevOps
- 📈 **Application Monitoring**: Health checks, metrics, and structured logging
- 🐳 **Docker Ready**: Fully containerized for consistent deployments
- ☁️ **AWS Cloud Deployment**: Infrastructure as Code with Terraform for scalable production deployment

## Tech Stack

### Frontend
- React 19
- React Router for navigation
- Zustand for state management
- TailwindCSS for styling
- Vite for build tooling

### Backend
- NestJS framework
- Prisma ORM
- PostgreSQL database
- JWT authentication
- File upload support

### DevOps
- Docker & Docker Compose
- Multi-stage builds for optimization
- Health checks for reliability
- Nginx for frontend serving
- AWS deployment with Terraform
- ECS Fargate for serverless containers
- Infrastructure as Code (IaC)

## Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd it-ticket
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start the application**
   ```bash
   make up
   # or
   docker compose up -d --build
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md)

### AWS Cloud Deployment

Deploy to AWS using Infrastructure as Code (Terraform):

1. **Configure GitHub Secrets**:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

2. **Deploy via GitHub Actions**:
   - Navigate to **Actions** → **Deploy to AWS**
   - Click **Run workflow**
   - Select environment and terraform action

3. **Access the application**:
   - Application URL will be provided in workflow output
   - Example: `http://it-ticket-alb-production-xxx.region.elb.amazonaws.com`

For detailed AWS deployment documentation, see [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)

### Local Development

#### Prerequisites
- Node.js 20+
- PostgreSQL 13+
- npm or yarn

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your database credentials
npx prisma migrate dev
npm run start:dev
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure .env with backend URL
npm run dev
```

## Project Structure

```
it-ticket/
├── backend/              # NestJS backend application
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── tickets/     # Ticket management
│   │   ├── users/       # User management
│   │   ├── notifications/ # Notification system
│   │   └── prisma/      # Prisma service
│   ├── prisma/          # Database schema and migrations
│   ├── Dockerfile       # Backend container configuration
│   └── docker-entrypoint.sh
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── stores/      # Zustand stores
│   ├── nginx.conf       # Nginx configuration
│   └── Dockerfile       # Frontend container configuration
├── docker-compose.yml   # Docker Compose configuration
├── Makefile            # Convenient commands
└── DOCKER.md           # Docker documentation
```

## Available Commands

### Using Makefile

```bash
make up              # Start all services
make down            # Stop all services  
make logs            # View logs
make backend-shell   # Access backend container
make frontend-shell  # Access frontend container
make db-shell        # Access database shell
make restart         # Restart all services
```

### Using npm

#### Backend
```bash
npm run build        # Build for production
npm run start        # Start production server
npm run start:dev    # Start development server
npm run test         # Run tests
npm run lint         # Lint code
```

#### Frontend
```bash
npm run build        # Build for production
npm run dev          # Start development server
npm run lint         # Lint code
```

## API Documentation

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Tickets
- `GET /tickets` - List user's tickets
- `GET /tickets/:id` - Get ticket details
- `POST /tickets` - Create new ticket
- `POST /tickets/:id/comments` - Add comment to ticket

### Admin Endpoints
- `GET /admin/tickets` - List all tickets
- `PATCH /admin/tickets/:id` - Update ticket
- `DELETE /admin/tickets/:id` - Delete ticket
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `PATCH /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

### Notifications
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/mark-all-read` - Mark all as read

### Database Management (Admin Only)
- `GET /admin/database/migration-status` - Check migration status
- `POST /admin/database/migrate` - Apply pending migrations
- `GET /admin/database/validate-schema` - Validate Prisma schema
- `GET /admin/database/info` - Get database information
- `POST /admin/database/backup` - Create database backup
- `GET /admin/database/backups` - List all backups
- `POST /admin/database/restore` - Restore from backup
- `DELETE /admin/database/backup` - Delete a backup

For detailed documentation, see [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md)

### Application Monitoring
- `GET /monitoring/health` - Application health check
- `GET /monitoring/metrics` - Performance metrics (Admin only)
- `GET /monitoring/logs` - Application logs (Admin only)

For detailed documentation, see [MONITORING.md](./MONITORING.md)

## Environment Variables

### Root `.env`
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=appdb
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key
PORT=3000
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=email@example.com
EMAIL_PASSWORD=password
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=IT Ticket System
```

## Testing

### Backend Tests
```bash
cd backend
npm run test          # Run unit tests
npm run test:e2e      # Run e2e tests
npm run test:cov      # Run with coverage
```

Test coverage is maintained above 80%.

## CI/CD Pipeline

This project uses a comprehensive CI/CD pipeline for automated testing, security scanning, and deployment.

### Automated Workflows

- **Continuous Integration**: Automatic testing and building on every push and PR
- **Pull Request Validation**: Code quality checks and test coverage enforcement
- **Security Scanning**: Daily vulnerability scans and CodeQL analysis
- **Docker Build**: Automated container building and health checks
- **Deployment**: Manual deployment to staging and production environments

### For Developers

Before submitting a PR:
```bash
# Run linting
cd backend && npm run lint
cd ../frontend && npm run lint

# Run tests
cd backend && npm test

# Check coverage
cd backend && npm run test:cov
```

All PRs must:
- Pass linting checks
- Have passing tests
- Maintain >80% test coverage
- Pass security scans

For detailed CI/CD documentation, see [CICD.md](./CICD.md)

## Security

- JWT-based authentication
- Password hashing with bcrypt
- File upload validation
- Input validation with class-validator
- SQL injection prevention via Prisma
- CORS configuration
- Security headers in nginx

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED License.

## Support

For issues and questions:
- Check [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for AWS deployment guide
- Check [DOCKER.md](./DOCKER.md) for containerization issues
- Check [CICD.md](./CICD.md) for CI/CD pipeline documentation
- Check [TICKET_FEATURE.md](./TICKET_FEATURE.md) for feature documentation
- Check [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md) for database management and backup/restore procedures
- Check [MONITORING.md](./MONITORING.md) for application monitoring and health checks
- Open an issue in the repository