# AWS Deployment Requirements

This document provides comprehensive information about the requirements, dependencies, and integration points for deploying the IT Ticket Management System to AWS.

## Overview

The deployment architecture separates concerns into three main components:

1. **Infrastructure Provisioning**: Managed in a dedicated Terraform repository
2. **Server Configuration**: Managed in a dedicated Ansible repository  
3. **Application Deployment**: Managed via CI/CD pipeline in this repository (`.github/workflows/cd.yml`)

This separation allows for better maintainability, security, and team collaboration.

## Table of Contents

- [AWS Credentials and Permissions](#aws-credentials-and-permissions)
- [Infrastructure Requirements](#infrastructure-requirements)
- [Integration with Terraform Repository](#integration-with-terraform-repository)
- [Integration with Ansible Repository](#integration-with-ansible-repository)
- [Deployment Workflow](#deployment-workflow)
- [Prerequisites for Automated Provisioning](#prerequisites-for-automated-provisioning)
- [Environment Variables and Secrets Configuration](#environment-variables-and-secrets-configuration)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)

## AWS Credentials and Permissions

### IAM User Requirements

Create an IAM user for CI/CD deployments with programmatic access. This user requires the following permissions:

#### Required AWS Service Permissions

1. **Amazon ECR (Elastic Container Registry)**
   - `ecr:GetAuthorizationToken`
   - `ecr:BatchCheckLayerAvailability`
   - `ecr:GetDownloadUrlForLayer`
   - `ecr:BatchGetImage`
   - `ecr:PutImage`
   - `ecr:InitiateLayerUpload`
   - `ecr:UploadLayerPart`
   - `ecr:CompleteLayerUpload`
   - `ecr:DescribeRepositories`

2. **Amazon ECS (Elastic Container Service)**
   - `ecs:UpdateService`
   - `ecs:DescribeServices`
   - `ecs:DescribeTasks`
   - `ecs:ListTasks`
   - `ecs:DescribeTaskDefinition`
   - `ecs:RegisterTaskDefinition`

3. **AWS Secrets Manager** (if application retrieves secrets)
   - `secretsmanager:GetSecretValue`
   - `secretsmanager:DescribeSecret`

4. **Amazon CloudWatch Logs** (optional, for monitoring)
   - `logs:CreateLogGroup`
   - `logs:CreateLogStream`
   - `logs:PutLogEvents`
   - `logs:DescribeLogStreams`

#### Sample IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": [
        "arn:aws:ecs:*:*:cluster/it-ticket-*",
        "arn:aws:ecs:*:*:service/it-ticket-*/it-ticket-*",
        "arn:aws:ecs:*:*:task-definition/it-ticket-*:*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:it-ticket-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/ecs/it-ticket-*"
    }
  ]
}
```

### Security Best Practices

1. **Use Least Privilege**: Grant only the permissions required for deployment
2. **Rotate Credentials**: Rotate AWS access keys every 90 days
3. **Enable MFA**: Enable Multi-Factor Authentication for all IAM users
4. **Use IAM Roles**: Consider using OIDC with GitHub Actions for temporary credentials
5. **Audit Access**: Regularly review CloudTrail logs for credential usage
6. **Separate Environments**: Use different IAM users/roles for staging and production

## Infrastructure Requirements

The CD workflow expects the following AWS infrastructure to be **already provisioned** by Terraform:

### Required Resources

1. **VPC and Networking**
   - VPC with public and private subnets across multiple Availability Zones
   - Internet Gateway for public subnet access
   - NAT Gateways for private subnet outbound connectivity
   - Route tables properly configured

2. **ECR (Elastic Container Registry)**
   - ECR repository for backend Docker images
   - ECR repository for frontend Docker images
   - Lifecycle policies for image retention (optional)

3. **ECS (Elastic Container Service)**
   - ECS Cluster using Fargate launch type
   - ECS Service with task definition
   - **Task definition must use `:latest` tags or be configured to pull from ECR repositories**
   - Auto-scaling policies (optional)
   - Service discovery (optional)
   
   **Important**: The ECS task definition should reference container images using `:latest` tags:
   ```json
   {
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "123456.dkr.ecr.us-east-1.amazonaws.com/it-ticket-backend-production:latest"
       },
       {
         "name": "frontend",
         "image": "123456.dkr.ecr.us-east-1.amazonaws.com/it-ticket-frontend-production:latest"
       }
     ]
   }
   ```
   This ensures the `--force-new-deployment` flag triggers ECS to pull the newly pushed images.

4. **Load Balancer**
   - Application Load Balancer in public subnets
   - Target groups for backend and frontend
   - Health check configurations
   - Listener rules for routing traffic

5. **RDS (Relational Database Service)**
   - PostgreSQL database instance in private subnets
   - Security groups allowing access from ECS tasks
   - Automated backups enabled
   - Multi-AZ deployment for production

6. **Security Groups**
   - ALB security group (allow inbound HTTP/HTTPS)
   - ECS task security group (allow traffic from ALB)
   - RDS security group (allow traffic from ECS tasks)

7. **IAM Roles**
   - ECS Task Execution Role (for pulling images, accessing secrets)
   - ECS Task Role (for application permissions)

8. **Secrets Manager**
   - Database credentials
   - JWT secrets
   - API keys and other sensitive configuration

9. **CloudWatch**
   - Log groups for ECS tasks
   - Alarms for monitoring (optional)

### Resource Naming Conventions

Infrastructure resources should follow this naming convention:

```
it-ticket-{resource-type}-{environment}
```

Examples:
- ECR: `it-ticket-backend-production`, `it-ticket-frontend-staging`
- ECS Cluster: `it-ticket-cluster-production`
- ECS Service: `it-ticket-service-staging`
- RDS: `it-ticket-db-production`
- ALB: `it-ticket-alb-staging`

## Integration with Terraform Repository

### Terraform Repository Structure

The Terraform repository should be organized separately and contain:

```
terraform-it-ticket/
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
├── modules/
│   ├── vpc/
│   ├── ecs/
│   ├── rds/
│   ├── ecr/
│   └── alb/
└── README.md
```

### Key Terraform Outputs Required

The Terraform configuration **must export** the following outputs for the CD workflow to function:

```hcl
# outputs.tf

output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend images"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "ECR repository URL for frontend images"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}
```

### Integration Points

1. **Initial Setup**: Run Terraform to provision infrastructure first
2. **Output Collection**: After `terraform apply`, collect output values
3. **Secrets Configuration**: Store Terraform outputs as GitHub secrets:
   - `ECR_BACKEND_REPOSITORY_STAGING`
   - `ECR_FRONTEND_REPOSITORY_STAGING`
   - `ECS_CLUSTER_STAGING`
   - `ECS_SERVICE_STAGING`
   - (Similar for production)

4. **Infrastructure Updates**: When infrastructure changes:
   - Update Terraform configuration in separate repository
   - Run `terraform plan` and `terraform apply`
   - Update GitHub secrets if outputs change
   - Redeploy application using CD workflow

### Terraform State Management

**Important**: Terraform state should be stored remotely for team collaboration:

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "it-ticket-terraform-state"
    key            = "environments/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

## Integration with Ansible Repository

### Ansible Repository Structure

The Ansible repository manages server configuration and should contain:

```
ansible-it-ticket/
├── inventories/
│   ├── staging/
│   │   └── hosts.yml
│   └── production/
│       └── hosts.yml
├── playbooks/
│   ├── site.yml
│   ├── database.yml
│   ├── monitoring.yml
│   └── security.yml
├── roles/
│   ├── common/
│   ├── docker/
│   ├── monitoring/
│   └── security/
├── group_vars/
│   ├── staging.yml
│   └── production.yml
└── README.md
```

### Ansible Responsibilities

Ansible should handle:

1. **OS Configuration**
   - System updates and security patches
   - User and group management
   - SSH key management
   - Firewall rules (if not using AWS security groups exclusively)

2. **Application Dependencies**
   - Docker installation and configuration (if using EC2 instead of Fargate)
   - Log rotation configuration
   - Monitoring agents installation

3. **Database Management**
   - Database initialization scripts
   - User and permission management
   - Backup configuration
   - Performance tuning

4. **Security Hardening**
   - SELinux/AppArmor configuration
   - Audit logging
   - Security scanning tools
   - Intrusion detection systems

5. **Monitoring Setup**
   - CloudWatch agent configuration
   - Prometheus/Grafana setup (if applicable)
   - Log forwarding configuration

### Integration Points with CD Workflow

For ECS Fargate deployments:
- Ansible is **primarily used** for database initialization and management
- Most server configuration is handled by Docker containers and ECS
- Ansible may run as a separate workflow or manual process

For EC2-based deployments:
- Ansible runs **before** the CD workflow
- Prepares servers for container runtime
- Configures system-level settings
- CD workflow then deploys application containers

### Example Ansible Playbook Integration

If using EC2 instances for ECS, run Ansible before deployment:

```yaml
# .github/workflows/configure-infrastructure.yml
name: Configure Infrastructure

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to configure'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  configure:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Ansible repository
        uses: actions/checkout@v4
        with:
          repository: your-org/ansible-it-ticket
          
      - name: Setup Ansible
        run: |
          pip install ansible boto3
          
      - name: Run Ansible playbook
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          ansible-playbook -i inventories/${{ github.event.inputs.environment }}/hosts.yml \
            playbooks/site.yml
```

## Deployment Workflow

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Actions                          │
│                                                                 │
│  1. Checkout Code                                               │
│  2. Configure AWS Credentials                                   │
│  3. Login to ECR                                                │
│  4. Build Docker Images (Backend & Frontend)                    │
│  5. Push Images to ECR                                          │
│  6. Update ECS Service (Trigger Deployment)                     │
│  7. Wait for Service Stability                                  │
│  8. Run Smoke Tests                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Infrastructure                       │
│                    (Provisioned by Terraform)                   │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │     ECR      │      │  ECS Fargate │      │     RDS      │ │
│  │  Repositories│ ───▶ │   Cluster    │ ───▶ │  PostgreSQL  │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│                              │                                  │
│                              ▼                                  │
│                      ┌──────────────┐                          │
│                      │     ALB      │                          │
│                      └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        End Users
```

### Workflow Stages

#### 1. Pre-Deployment

- **Code Review**: Ensure all changes are reviewed and approved
- **CI Pipeline**: All tests pass in CI workflow
- **Security Scanning**: No critical vulnerabilities detected

#### 2. Build Phase

- Checkout the specified version (tag or branch)
- Build Docker images for backend and frontend
- Tag images with both `latest` and commit SHA
- Push images to Amazon ECR

#### 3. Deployment Phase

- Update ECS service to trigger new deployment
- ECS pulls new images from ECR
- ECS starts new tasks with updated images
- Health checks validate new tasks
- Traffic gradually shifts to new tasks (if using blue/green)

#### 4. Verification Phase

- Wait for ECS service to stabilize
- Run smoke tests against health endpoints
- Verify application functionality
- Generate deployment summary

#### 5. Post-Deployment

- Monitor CloudWatch logs for errors
- Verify metrics and alarms
- Update documentation if needed
- Notify team of successful deployment

### Rollback Strategy

If deployment fails or issues are discovered:

1. **Automatic Rollback**: ECS automatically rolls back if health checks fail
2. **Manual Rollback**: Deploy previous version by specifying earlier commit SHA
3. **Emergency Rollback**: Use AWS Console to revert to previous task definition

```bash
# Manual rollback command
aws ecs update-service \
  --cluster it-ticket-cluster-production \
  --service it-ticket-service-production \
  --task-definition it-ticket-task-production:PREVIOUS_REVISION \
  --force-new-deployment
```

## Prerequisites for Automated Provisioning

Before running the CD workflow, ensure the following prerequisites are met:

### 1. Infrastructure Provisioned

- [ ] Terraform repository set up and infrastructure deployed
- [ ] All required AWS resources created (VPC, ECS, RDS, ECR, ALB)
- [ ] Terraform outputs documented and available
- [ ] Network connectivity verified (internet access, NAT gateways)

### 2. Database Initialized

- [ ] RDS PostgreSQL instance running
- [ ] Database schema created (via Prisma migrations)
- [ ] Database user permissions configured
- [ ] Connection strings tested
- [ ] Backup configuration verified

### 3. Secrets Configured

- [ ] Database credentials stored in AWS Secrets Manager
- [ ] JWT secret generated and stored
- [ ] API keys configured (if applicable)
- [ ] Environment-specific secrets set up

### 4. GitHub Configuration

- [ ] Repository secrets configured (see next section)
- [ ] GitHub Actions enabled
- [ ] Workflow permissions configured
- [ ] Environment protection rules set (for production)

### 5. DNS and SSL/TLS (Optional)

- [ ] Custom domain registered
- [ ] Route 53 hosted zone configured (or external DNS)
- [ ] SSL/TLS certificate issued (AWS Certificate Manager)
- [ ] ALB listener configured for HTTPS

### 6. Monitoring Setup

- [ ] CloudWatch log groups created
- [ ] CloudWatch alarms configured
- [ ] SNS topics for notifications (optional)
- [ ] Dashboards created for visualization

## Environment Variables and Secrets Configuration

### GitHub Secrets Required

Configure these secrets in **GitHub Repository Settings** → **Secrets and variables** → **Actions**:

#### Core AWS Credentials

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS IAM user access key | `AKIAIOSFODNN7EXAMPLE` | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCY...` | Yes |
| `AWS_REGION` | AWS region for deployment | `us-east-1` | Yes |

#### Staging Environment Secrets

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `ECR_BACKEND_REPOSITORY_STAGING` | Backend ECR repository URL | `123456.dkr.ecr.us-east-1.amazonaws.com/it-ticket-backend-staging` | Yes |
| `ECR_FRONTEND_REPOSITORY_STAGING` | Frontend ECR repository URL | `123456.dkr.ecr.us-east-1.amazonaws.com/it-ticket-frontend-staging` | Yes |
| `ECS_CLUSTER_STAGING` | ECS cluster name | `it-ticket-cluster-staging` | Yes |
| `ECS_SERVICE_STAGING` | ECS service name | `it-ticket-service-staging` | Yes |
| `APP_URL_STAGING` | Application URL | `http://staging.example.com` | Yes |
| `API_URL_STAGING` | API URL for frontend | `http://staging.example.com/api` | Yes |

#### Production Environment Secrets

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `ECR_BACKEND_REPOSITORY_PRODUCTION` | Backend ECR repository URL | `123456.dkr.ecr.us-east-1.amazonaws.com/it-ticket-backend-production` | Yes |
| `ECR_FRONTEND_REPOSITORY_PRODUCTION` | Frontend ECR repository URL | `123456.dkr.ecr.us-east-1.amazonaws.com/it-ticket-frontend-production` | Yes |
| `ECS_CLUSTER_PRODUCTION` | ECS cluster name | `it-ticket-cluster-production` | Yes |
| `ECS_SERVICE_PRODUCTION` | ECS service name | `it-ticket-service-production` | Yes |
| `APP_URL_PRODUCTION` | Application URL | `https://app.example.com` | Yes |
| `API_URL_PRODUCTION` | API URL for frontend | `https://app.example.com/api` | Yes |

### Application Environment Variables

These are configured in **ECS Task Definition** (managed by Terraform):

#### Backend Environment Variables

```json
{
  "environment": [
    {
      "name": "NODE_ENV",
      "value": "production"
    },
    {
      "name": "PORT",
      "value": "3000"
    },
    {
      "name": "FRONTEND_URL",
      "value": "${APP_URL}"
    }
  ],
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:it-ticket-db-url"
    },
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:it-ticket-jwt-secret"
    }
  ]
}
```

#### Frontend Build Arguments

```dockerfile
# Built at deployment time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
```

### AWS Secrets Manager Structure

Store sensitive data in AWS Secrets Manager:

```json
{
  "it-ticket-database-staging": {
    "username": "dbuser",
    "password": "securepassword",
    "engine": "postgres",
    "host": "it-ticket-db-staging.xxx.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "appdb"
  },
  "it-ticket-jwt-secret-staging": {
    "secret": "your-jwt-secret-key-here"
  }
}
```

### Retrieving Terraform Outputs

After infrastructure provisioning, retrieve outputs:

```bash
cd terraform/environments/production
terraform output -json > outputs.json

# Extract specific values
export ECR_BACKEND=$(terraform output -raw ecr_backend_repository_url)
export ECR_FRONTEND=$(terraform output -raw ecr_frontend_repository_url)
export ECS_CLUSTER=$(terraform output -raw ecs_cluster_name)
export ECS_SERVICE=$(terraform output -raw ecs_service_name)
export APP_URL="http://$(terraform output -raw alb_dns_name)"

# Add these to GitHub secrets manually or via CLI
gh secret set ECR_BACKEND_REPOSITORY_PRODUCTION -b "$ECR_BACKEND"
gh secret set ECR_FRONTEND_REPOSITORY_PRODUCTION -b "$ECR_FRONTEND"
gh secret set ECS_CLUSTER_PRODUCTION -b "$ECS_CLUSTER"
gh secret set ECS_SERVICE_PRODUCTION -b "$ECS_SERVICE"
gh secret set APP_URL_PRODUCTION -b "$APP_URL"
```

## Deployment Process

### Step-by-Step Deployment Guide

#### 1. Initial Infrastructure Setup

```bash
# Clone Terraform repository
git clone https://github.com/your-org/terraform-it-ticket.git
cd terraform-it-ticket/environments/staging

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply infrastructure
terraform apply

# Save outputs
terraform output -json > outputs.json
```

#### 2. Configure GitHub Secrets

Use the Terraform outputs to configure GitHub secrets:

```bash
# Navigate to application repository
cd /path/to/it-ticket

# Set AWS credentials (get from IAM console)
gh secret set AWS_ACCESS_KEY_ID -b "YOUR_ACCESS_KEY"
gh secret set AWS_SECRET_ACCESS_KEY -b "YOUR_SECRET_KEY"
gh secret set AWS_REGION -b "us-east-1"

# Set environment-specific secrets from Terraform outputs
# (repeat for production with -PRODUCTION suffix)
gh secret set ECR_BACKEND_REPOSITORY_STAGING -b "$(cat ../terraform-it-ticket/environments/staging/outputs.json | jq -r '.ecr_backend_repository_url.value')"
gh secret set ECR_FRONTEND_REPOSITORY_STAGING -b "$(cat ../terraform-it-ticket/environments/staging/outputs.json | jq -r '.ecr_frontend_repository_url.value')"
gh secret set ECS_CLUSTER_STAGING -b "$(cat ../terraform-it-ticket/environments/staging/outputs.json | jq -r '.ecs_cluster_name.value')"
gh secret set ECS_SERVICE_STAGING -b "$(cat ../terraform-it-ticket/environments/staging/outputs.json | jq -r '.ecs_service_name.value')"
gh secret set APP_URL_STAGING -b "http://$(cat ../terraform-it-ticket/environments/staging/outputs.json | jq -r '.alb_dns_name.value')"
gh secret set API_URL_STAGING -b "http://$(cat ../terraform-it-ticket/environments/staging/outputs.json | jq -r '.alb_dns_name.value')"
```

#### 3. Initialize Database

Run database migrations manually or via Ansible:

```bash
# Connect to database via bastion host or VPN
export DATABASE_URL="postgresql://user:pass@hostname:5432/dbname"

# Run Prisma migrations
cd backend
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

#### 4. Run First Deployment

Navigate to GitHub Actions and run the CD workflow:

1. Go to **Actions** tab
2. Select **Continuous Deployment** workflow
3. Click **Run workflow**
4. Select environment: `staging`
5. Leave version empty (deploy latest)
6. Click **Run workflow**

#### 5. Verify Deployment

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster it-ticket-cluster-staging \
  --services it-ticket-service-staging \
  --region us-east-1

# Test health endpoint
curl http://your-alb-dns-name.us-east-1.elb.amazonaws.com/health

# Test frontend
curl http://your-alb-dns-name.us-east-1.elb.amazonaws.com/

# Check CloudWatch logs
aws logs tail /ecs/it-ticket-backend-staging --follow
```

#### 6. Production Deployment

After successful staging deployment:

1. Test all functionality in staging
2. Create a release tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
3. Push tag: `git push origin v1.0.0`
4. Run CD workflow for production environment
5. Specify the version tag in workflow inputs
6. Monitor deployment closely
7. Run production smoke tests

### Continuous Deployment Flow

```
┌─────────────┐
│   Develop   │
│   Feature   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Create PR  │
│  Run CI     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Merge to   │
│    main     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Manual    │
│   Deploy    │
│  to Staging │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Test     │
│   Staging   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Create    │
│  Release    │
│     Tag     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Manual    │
│   Deploy    │
│to Production│
└─────────────┘
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: ECR Push Denied

**Symptoms**: 
```
Error: denied: User is not authorized to perform: ecr:PutImage
```

**Solution**:
1. Verify AWS credentials in GitHub secrets
2. Check IAM user has ECR permissions
3. Verify ECR repository exists
4. Check repository policy allows push from the IAM user

#### Issue: ECS Service Update Fails

**Symptoms**:
```
Error: Service update failed
```

**Solution**:
1. Check ECS cluster and service names are correct in secrets
2. Verify IAM user has `ecs:UpdateService` permission
3. Check if ECS service exists and is active
4. Review CloudWatch logs for task failures

#### Issue: New Tasks Not Starting

**Symptoms**: ECS service stuck in "draining" or tasks keep stopping

**Solution**:
1. Check CloudWatch logs for task failures
2. Verify task execution role has permissions to pull images
3. Check task definition environment variables and secrets
4. Verify security groups allow required traffic
5. Check if database is accessible from ECS tasks

#### Issue: Health Checks Failing

**Symptoms**: ALB marks targets as unhealthy

**Solution**:
1. Verify health check endpoint is accessible
2. Check health check path in ALB target group settings
3. Verify security groups allow ALB to reach tasks
4. Check application logs for startup errors
5. Increase health check timeout if application is slow to start

#### Issue: Smoke Tests Timeout

**Symptoms**: Smoke tests step fails with timeout

**Solution**:
1. Increase wait time in smoke test step
2. Check ALB DNS resolves correctly
3. Verify ALB listener routes traffic to correct target group
4. Check application is actually responding to requests
5. Review security group rules

### Debugging Commands

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster CLUSTER_NAME \
  --services SERVICE_NAME

# List running tasks
aws ecs list-tasks \
  --cluster CLUSTER_NAME \
  --service-name SERVICE_NAME

# Describe a specific task
aws ecs describe-tasks \
  --cluster CLUSTER_NAME \
  --tasks TASK_ARN

# View CloudWatch logs
aws logs tail /ecs/it-ticket-backend-staging --follow

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn TARGET_GROUP_ARN

# Test database connectivity
aws rds describe-db-instances \
  --db-instance-identifier it-ticket-db-staging

# Verify secrets
aws secretsmanager get-secret-value \
  --secret-id it-ticket-database-staging
```

### Getting Help

1. **Check CloudWatch Logs**: Most issues can be diagnosed from application logs
2. **Review GitHub Actions Logs**: Detailed logs available in workflow run
3. **AWS Support**: For infrastructure-related issues
4. **Documentation**: Refer to AWS ECS, ECR, and RDS documentation
5. **Team**: Reach out to DevOps team for assistance

## Additional Resources

- [Terraform Repository](https://github.com/your-org/terraform-it-ticket) - Infrastructure as Code
- [Ansible Repository](https://github.com/your-org/ansible-it-ticket) - Configuration Management
- [CI/CD Documentation](./CICD.md) - Full CI/CD pipeline details
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Docker Documentation](./DOCKER.md) - Container best practices
- [Monitoring Guide](./MONITORING.md) - Application monitoring setup

## Appendix: Complete Deployment Checklist

Use this checklist for new environment setup:

### Infrastructure Setup (Terraform)
- [ ] Fork/clone Terraform repository
- [ ] Configure AWS credentials locally
- [ ] Review and customize Terraform variables
- [ ] Initialize Terraform backend (S3 + DynamoDB)
- [ ] Run `terraform plan` and review changes
- [ ] Run `terraform apply` to provision infrastructure
- [ ] Save Terraform outputs to secure location
- [ ] Verify all resources created successfully

### Configuration Management (Ansible)
- [ ] Fork/clone Ansible repository
- [ ] Update inventory files with new infrastructure
- [ ] Configure group variables for environment
- [ ] Review and customize playbooks
- [ ] Test Ansible connectivity
- [ ] Run database initialization playbook
- [ ] Run security hardening playbook
- [ ] Verify configurations applied correctly

### Application Deployment (CD Workflow)
- [ ] Configure GitHub repository secrets (AWS credentials)
- [ ] Configure environment-specific secrets (ECR, ECS details)
- [ ] Test CD workflow on staging environment
- [ ] Verify application deployed successfully
- [ ] Run smoke tests and integration tests
- [ ] Configure monitoring and alerts
- [ ] Document any custom configurations
- [ ] Update team documentation

### Post-Deployment
- [ ] Configure custom domain (if applicable)
- [ ] Set up SSL/TLS certificate
- [ ] Configure backup and restore procedures
- [ ] Set up monitoring dashboards
- [ ] Configure log aggregation
- [ ] Train team on deployment process
- [ ] Document rollback procedures
- [ ] Schedule regular security reviews

---

**Last Updated**: 2026-01-07  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
