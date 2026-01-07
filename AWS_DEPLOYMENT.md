# AWS Deployment Guide

This document provides a comprehensive guide for deploying the IT Ticket Management System to AWS using Infrastructure as Code (Terraform) and automated CI/CD pipelines.

## Overview

The application is deployed on AWS using a modern, scalable, and secure architecture:

- **Infrastructure as Code**: Terraform provisions all AWS resources
- **Containerization**: Docker images for backend and frontend
- **Serverless Compute**: ECS Fargate for container orchestration
- **Managed Services**: RDS PostgreSQL, S3, Secrets Manager
- **High Availability**: Multi-AZ deployment with auto-scaling
- **CI/CD Integration**: GitHub Actions for automated deployment

## Architecture

```
Internet
    |
    v
Application Load Balancer (Public Subnets)
    |
    +--- Frontend (ECS Fargate)
    |
    +--- Backend (ECS Fargate)
             |
             +--- RDS PostgreSQL (Private Subnets)
             |
             +--- S3 Bucket (Application Assets)
             |
             +--- Secrets Manager (Credentials)
```

### Components

1. **VPC**: Isolated network with public and private subnets across 2 AZs
2. **Application Load Balancer**: Routes traffic to frontend and backend containers
3. **ECS Cluster**: Runs containers using Fargate (serverless)
4. **RDS PostgreSQL**: Managed database in private subnets
5. **S3 Bucket**: Storage for user uploads and application assets
6. **ECR**: Container registries for Docker images
7. **Secrets Manager**: Secure storage for database credentials and secrets
8. **CloudWatch**: Logs and metrics collection

## Prerequisites

### AWS Account Setup

1. **AWS Account** with administrative access
2. **IAM User** with programmatic access and permissions for:
   - VPC, EC2, ECS, ECR
   - RDS, S3, Secrets Manager
   - IAM, CloudWatch Logs
   - Application Load Balancer

### GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS access key | AKIAIOSFODNN7EXAMPLE |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY |
| `AWS_REGION` | AWS region | us-east-1 |

### Local Development Setup

For local development and testing:

```bash
# Install Terraform
brew install terraform  # macOS
# or download from https://www.terraform.io/downloads

# Install AWS CLI
brew install awscli  # macOS
# or download from https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
```

## Deployment Process

### Option 1: Automated Deployment (Recommended)

Use GitHub Actions for automated deployment:

1. **Navigate to GitHub Actions**:
   - Go to your repository
   - Click **Actions** tab
   - Select **Deploy to AWS** workflow

2. **Run Workflow**:
   - Click **Run workflow** button
   - Select options:
     - **Environment**: `staging` or `production`
     - **Terraform Action**: `plan` (preview) or `apply` (deploy)
     - **Version**: Leave empty for latest or specify a tag/branch
   - Click **Run workflow**

3. **Monitor Progress**:
   - Watch the workflow execution in real-time
   - Review Terraform plan output
   - Verify deployment success

4. **Access Application**:
   - After successful deployment, the Application URL will be displayed in the workflow summary
   - Example: `http://it-ticket-alb-production-123456789.us-east-1.elb.amazonaws.com`

### Option 2: Manual Deployment

For manual infrastructure deployment:

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration

# Preview changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

After infrastructure is provisioned, deploy the application:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t it-ticket-backend:latest .
docker tag it-ticket-backend:latest \
  <ecr_backend_url>:latest
docker push <ecr_backend_url>:latest

# Build and push frontend
cd ../frontend
docker build -t it-ticket-frontend:latest .
docker tag it-ticket-frontend:latest \
  <ecr_frontend_url>:latest
docker push <ecr_frontend_url>:latest

# Update ECS service
aws ecs update-service \
  --cluster it-ticket-cluster-production \
  --service it-ticket-service-production \
  --force-new-deployment
```

## Configuration

### Environment Variables

The application uses the following environment variables in AWS:

#### Backend (ECS Task Definition)

- `NODE_ENV`: Set to `production`
- `PORT`: Backend port (3000)
- `AWS_REGION`: AWS region
- `S3_BUCKET_NAME`: S3 bucket for assets
- `DB_SECRET_ARN`: ARN of database credentials in Secrets Manager
- `FRONTEND_URL`: Frontend URL (ALB DNS name)

#### Secrets (from Secrets Manager)

- `JWT_SECRET`: JWT signing secret (auto-generated)
- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `EMAIL_FROM`: Email sender address

### Database Configuration

The database credentials are automatically managed by AWS Secrets Manager:

```json
{
  "username": "postgres",
  "password": "<auto-generated>",
  "engine": "postgres",
  "host": "<rds-endpoint>",
  "port": 5432,
  "dbname": "appdb"
}
```

The backend application automatically:
1. Retrieves credentials from Secrets Manager on startup
2. Constructs the `DATABASE_URL` connection string
3. Connects to RDS PostgreSQL

### S3 Configuration

The S3 bucket is configured for:
- **Encryption**: AES256 server-side encryption
- **Versioning**: Enabled for data protection
- **Access Control**: Private with IAM-based access
- **Lifecycle Policies**: Automatic archival and cleanup

The backend application uses the S3 service to:
- Upload user files (attachments, profile images)
- Store generated reports
- Manage application assets

## Application Features in AWS

### Database Connection

The backend automatically connects to RDS using Secrets Manager:

```typescript
// Secrets are loaded on application startup
// No manual configuration needed
```

### File Storage

Files are stored in S3 instead of local filesystem:

```typescript
// Example usage in backend
const s3Service = this.s3Service;
await s3Service.uploadFile('uploads/file.pdf', buffer, 'application/pdf');
```

### Health Checks

Health endpoints are monitored by ALB:
- **Backend**: `GET /health`
- **Frontend**: `GET /`

### Auto Scaling

The ECS service automatically scales based on:
- **CPU Utilization**: Target 70%
- **Memory Utilization**: Target 80%
- **Scaling Range**: 1-4 tasks

## Monitoring and Maintenance

### CloudWatch Logs

View application logs:

```bash
# Backend logs
aws logs tail /ecs/it-ticket-production --follow \
  --filter-pattern "backend"

# Frontend logs
aws logs tail /ecs/it-ticket-production --follow \
  --filter-pattern "frontend"
```

### Metrics

Monitor application metrics in AWS Console:
1. Navigate to **CloudWatch** → **Container Insights**
2. Select your ECS cluster
3. View CPU, memory, network metrics

### Database Backups

Automated daily backups are configured:
- **Backup Window**: 3:00-4:00 AM UTC
- **Retention**: 7 days
- **Manual Snapshots**: Can be created anytime

Create a manual snapshot:

```bash
aws rds create-db-snapshot \
  --db-instance-identifier it-ticket-db-production \
  --db-snapshot-identifier manual-snapshot-$(date +%Y%m%d)
```

### Updating the Application

To deploy application updates:

1. **Via GitHub Actions** (Recommended):
   - Push code changes to repository
   - Run **Deploy to AWS** workflow
   - Select `apply` for terraform action

2. **Manual Update**:
   ```bash
   # Build and push new images to ECR
   # Then force new deployment
   aws ecs update-service \
     --cluster it-ticket-cluster-production \
     --service it-ticket-service-production \
     --force-new-deployment
   ```

### Scaling

#### Manual Scaling

Update the desired task count:

```bash
aws ecs update-service \
  --cluster it-ticket-cluster-production \
  --service it-ticket-service-production \
  --desired-count 3
```

#### Auto Scaling

Auto-scaling is configured automatically. To modify:
1. Update `app_min_capacity` and `app_max_capacity` in `terraform.tfvars`
2. Apply Terraform changes

## Security Considerations

### Network Security

- **RDS**: Only accessible from ECS tasks (private subnets)
- **S3**: Private bucket with IAM-based access control
- **ALB**: Publicly accessible on port 80/443
- **ECS Tasks**: In private subnets with NAT Gateway for outbound traffic

### Secrets Management

- **No Hard-coded Secrets**: All secrets stored in AWS Secrets Manager
- **IAM Roles**: ECS tasks use IAM roles for AWS service access
- **Rotation**: Secrets can be rotated without application redeployment

### Encryption

- **At Rest**: 
  - RDS: Encrypted with AWS KMS
  - S3: Server-side encryption (AES256)
  - ECR: Repository encryption
- **In Transit**: 
  - TLS/HTTPS recommended (configure ALB HTTPS listener)
  - RDS connections use TLS

### IAM Permissions

ECS tasks have minimal required permissions:
- Read secrets from Secrets Manager
- Read/write to S3 bucket
- Write logs to CloudWatch

## Troubleshooting

### Common Issues

#### 1. ECS Tasks Failing to Start

**Symptoms**: Tasks start but immediately stop

**Solutions**:
- Check CloudWatch logs for error messages
- Verify ECR images are pushed successfully
- Confirm Secrets Manager secrets exist
- Check IAM role permissions

```bash
# View task failures
aws ecs describe-tasks \
  --cluster it-ticket-cluster-production \
  --tasks <task-id>
```

#### 2. Database Connection Errors

**Symptoms**: Backend logs show database connection failures

**Solutions**:
- Verify RDS instance is running
- Check security group rules (ECS → RDS)
- Confirm Secrets Manager contains correct credentials
- Verify DATABASE_URL construction

#### 3. S3 Access Denied

**Symptoms**: File upload/download failures

**Solutions**:
- Check ECS task role has S3 permissions
- Verify S3 bucket policy
- Confirm bucket name is correct

#### 4. Application Not Accessible

**Symptoms**: Cannot access ALB DNS name

**Solutions**:
- Verify ALB is active and healthy
- Check target group health
- Confirm security group allows HTTP (port 80)
- Wait for ECS tasks to pass health checks

### Getting Help

For additional support:
1. Review AWS service documentation
2. Check CloudWatch logs and metrics
3. Open an issue in the GitHub repository

## Cost Optimization

### Development/Staging

For non-production environments:
- Use `db.t3.micro` for RDS
- Set `app_desired_count = 1`
- Use single NAT Gateway
- Consider ECS Fargate Spot

### Production

To optimize production costs:
- Use Reserved Instances for predictable workloads
- Enable ECS Fargate Savings Plans
- Configure S3 lifecycle policies
- Monitor and right-size resources

### Cost Monitoring

Set up AWS Cost Explorer and Budgets:
1. Navigate to AWS Console → **Cost Management**
2. Create budget alerts for spending thresholds
3. Review monthly cost reports

## Disaster Recovery

### Backup Strategy

1. **Database**: 
   - Automated daily backups (7-day retention)
   - Manual snapshots before major changes

2. **Application**:
   - Docker images in ECR (versioned)
   - Infrastructure as Code in Git

3. **Data**:
   - S3 versioning enabled
   - Cross-region replication (optional)

### Recovery Procedures

#### Restore Database

```bash
# Restore from automated backup
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier it-ticket-db-production \
  --target-db-instance-identifier it-ticket-db-restored \
  --restore-time 2024-01-01T12:00:00Z
```

#### Rollback Application

```bash
# Deploy previous version
docker pull <ecr_url>:<previous-sha>
docker tag <ecr_url>:<previous-sha> <ecr_url>:latest
docker push <ecr_url>:latest

# Force new deployment
aws ecs update-service \
  --cluster it-ticket-cluster-production \
  --service it-ticket-service-production \
  --force-new-deployment
```

## Next Steps

After successful deployment:

1. **Configure DNS**: Point your domain to ALB DNS name
2. **Enable HTTPS**: Configure ALB HTTPS listener with SSL certificate
3. **Set up Monitoring**: Configure CloudWatch alarms
4. **Enable Backups**: Verify backup schedules
5. **Security Audit**: Review security groups and IAM policies
6. **Performance Testing**: Test application under load
7. **Documentation**: Update team documentation with AWS details

## Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
