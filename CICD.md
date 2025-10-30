# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline implementation for the IT Ticket Management System.

## Overview

The CI/CD pipeline automates testing, security scanning, and deployment processes to ensure code quality and safe deployments.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint and Test
- Runs on Ubuntu with PostgreSQL service
- Installs frontend and backend dependencies
- Sets up Prisma and runs migrations
- Executes linting for both frontend and backend
- Builds both applications
- Runs backend unit tests with coverage
- Uploads coverage reports to Codecov

#### Build Docker
- Builds Docker images
- Starts services via Docker Compose
- Validates service health
- Checks backend health endpoint
- Verifies frontend availability

**Purpose:** Ensures all code changes pass quality checks before merging.

### 2. Pull Request Validation (`pr-validation.yml`)

**Triggers:**
- Pull request events (opened, synchronize, reopened)

**Jobs:**

#### Validate PR
- Validates PR title follows semantic conventions
- Checks for merge conflicts
- Detects large files (>5MB)

#### Code Quality
- Runs comprehensive linting
- Executes tests with coverage reporting
- Validates Prisma schema
- Ensures test coverage meets 80% threshold
- Comments coverage report on PR

**Purpose:** Provides immediate feedback on pull requests before review.

### 3. Security Scanning (`security.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Scheduled daily at 2 AM UTC

**Jobs:**

#### Dependency Scan
- Runs `npm audit` for backend and frontend
- Reports moderate and high severity vulnerabilities

#### CodeQL Analysis
- Performs static analysis for security vulnerabilities
- Scans JavaScript/TypeScript code
- Uses security-and-quality query suite

**Purpose:** Identifies security vulnerabilities early in the development cycle.

### 4. Docker Build (`docker.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Push of version tags (`v*`)
- Pull requests to `main`

**Jobs:**

#### Docker Build Test
- Builds Docker images using Docker Compose
- Validates container health
- Tests service availability
- Optionally pushes images to GitHub Container Registry

**Purpose:** Validates Docker containerization and prepares images for deployment.

### 5. Deployment (`deploy.yml`)

**Triggers:**
- Manual workflow dispatch

**Inputs:**
- `environment`: staging or production
- `version`: optional version tag to deploy

**Jobs:**

#### Deploy to Staging
- Builds application
- Deploys to staging environment
- Runs smoke tests
- Sends deployment notifications

#### Deploy to Production
- Validates version tag
- Creates backup before deployment
- Runs pre-deployment checks
- Deploys to production
- Executes smoke tests
- Rolls back on failure
- Sends deployment notifications

**Purpose:** Automates deployment to different environments with safety checks.

## Workflow Status Badges

The README includes status badges for key workflows:

```markdown
[![CI](https://github.com/EdoAbarca/it-ticket/actions/workflows/ci.yml/badge.svg)](...)
[![Security Scanning](https://github.com/EdoAbarca/it-ticket/actions/workflows/security.yml/badge.svg)](...)
[![Docker Build](https://github.com/EdoAbarca/it-ticket/actions/workflows/docker.yml/badge.svg)](...)
```

## Test Coverage

- **Minimum Coverage:** 80%
- **Coverage Reporting:** Automated via Codecov
- **Enforcement:** PR validation workflow blocks merges below threshold

## Security Measures

1. **Dependency Scanning:** Daily npm audit checks
2. **CodeQL Analysis:** Static security analysis on every push
3. **Secret Detection:** GitHub's secret scanning (repository setting)
4. **Container Scanning:** Docker image vulnerability checks (optional)

## Deployment Strategy

### Staging Deployment
1. Manual trigger via GitHub Actions UI
2. Automatic deployment to staging environment
3. Smoke tests validate deployment
4. Notifications sent on success/failure

### Production Deployment
1. Manual trigger with version specification
2. Pre-deployment validation
3. Automatic backup creation
4. Blue-green or rolling deployment
5. Post-deployment smoke tests
6. Automatic rollback on failure
7. Notifications to team

## Best Practices

### For Developers

1. **Before Committing:**
   - Run `npm run lint` locally
   - Run `npm test` to ensure tests pass
   - Ensure test coverage is adequate

2. **Pull Requests:**
   - Follow semantic commit conventions
   - Keep PRs focused and small
   - Wait for all checks to pass before requesting review
   - Address coverage warnings

3. **Testing:**
   - Write tests for new features
   - Maintain minimum 80% coverage
   - Include integration tests where appropriate

### For DevOps

1. **Monitoring:**
   - Check workflow runs daily
   - Review security scan results
   - Monitor deployment success rates

2. **Maintenance:**
   - Keep GitHub Actions up to date
   - Review and update dependencies regularly
   - Rotate secrets and credentials

3. **Deployment:**
   - Always deploy to staging first
   - Verify staging deployment before production
   - Have rollback plan ready
   - Document deployment procedures

## Environment Variables

Required environment variables for CI/CD:

### GitHub Secrets (Optional)
- `CODECOV_TOKEN`: For coverage reporting (optional)
- `SLACK_WEBHOOK`: For deployment notifications (optional)
- `DOCKER_HUB_TOKEN`: For Docker registry push (optional)

### Workflow Environment Variables
Set in workflow files:
- `NODE_ENV`: production/development
- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_*`: Database configuration

## Troubleshooting

### Common Issues

**Tests failing in CI but passing locally:**
- Ensure local environment matches CI environment
- Check for hardcoded paths or environment-specific code
- Verify all dependencies are in package.json

**Docker build failures:**
- Check if .env files are properly created
- Verify Docker Compose configuration
- Review resource limits

**Deployment failures:**
- Check deployment logs
- Verify credentials and access
- Ensure target environment is healthy

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Consult team lead or DevOps engineer
4. Open an issue in the repository

## Continuous Improvement

The CI/CD pipeline should evolve with the project:

- **Add more tests** as features grow
- **Enhance security scanning** with additional tools
- **Optimize workflow performance** by caching dependencies
- **Improve deployment automation** based on feedback
- **Add metrics and monitoring** for pipeline health

## Performance Metrics

Target metrics for CI/CD pipeline:

- **Build Time:** < 10 minutes
- **Test Coverage:** > 80%
- **Security Scan:** 0 high/critical vulnerabilities
- **Deployment Time:** < 15 minutes
- **Deployment Success Rate:** > 95%

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Semantic Commit Messages](https://www.conventionalcommits.org/)
