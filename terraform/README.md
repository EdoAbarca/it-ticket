# Terraform Infrastructure for IT Ticket System

This directory contains Terraform configuration to provision and manage AWS infrastructure for the IT Ticket Management System.

## Architecture Overview

The infrastructure includes:

- **VPC**: Isolated network with public and private subnets across 2 availability zones
- **RDS PostgreSQL**: Managed database in private subnets for data persistence
- **S3 Bucket**: Encrypted storage for application assets (uploads, reports, etc.)
- **ECS Cluster**: Fargate-based container orchestration for running the application
- **Application Load Balancer**: Distributes traffic to ECS tasks in public subnets
- **ECR Repositories**: Container registries for backend and frontend Docker images
- **Secrets Manager**: Secure storage for database credentials and application secrets
- **Security Groups**: Network access control between components
- **CloudWatch Logs**: Centralized logging for application containers
- **Auto Scaling**: Automatic scaling based on CPU and memory metrics

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **Terraform** (>= 1.0) installed
3. **AWS CLI** configured with credentials
4. **GitHub Secrets** configured:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

## Quick Start

### 1. Configure Variables

Copy the example variables file and customize it:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your desired configuration:

```hcl
aws_region   = "us-east-1"
environment  = "production"
project_name = "it-ticket"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan Infrastructure

```bash
terraform plan -out=tfplan
```

Review the planned changes carefully before applying.

### 4. Apply Infrastructure

```bash
terraform apply tfplan
```

This will provision all AWS resources. The process takes approximately 10-15 minutes.

### 5. Get Outputs

After successful deployment, view the infrastructure outputs:

```bash
terraform output
```

Key outputs include:
- **alb_dns_name**: Application URL
- **ecr_backend_repository_url**: Backend container registry
- **ecr_frontend_repository_url**: Frontend container registry
- **s3_bucket_name**: Asset storage bucket

## Deployment via GitHub Actions

The preferred deployment method is through GitHub Actions:

1. Navigate to **Actions** → **Deploy to AWS**
2. Click **Run workflow**
3. Select:
   - **Environment**: staging or production
   - **Terraform Action**: plan (to preview) or apply (to deploy)
   - **Version**: Optional git tag/branch
4. Click **Run workflow**

The workflow will:
- Configure AWS credentials from GitHub Secrets
- Run Terraform to provision/update infrastructure
- Build and push Docker images to ECR
- Deploy the application to ECS
- Run smoke tests to verify deployment

## Infrastructure Components

### Networking

- **VPC**: 10.0.0.0/16 CIDR block
- **Public Subnets**: 2 subnets for ALB
- **Private Subnets**: 2 subnets for ECS and RDS
- **NAT Gateways**: For outbound internet access from private subnets
- **Internet Gateway**: For public subnet internet access

### Compute

- **ECS Cluster**: Fargate-based cluster for serverless containers
- **ECS Service**: Runs backend and frontend containers
- **Auto Scaling**: Scales between 1-4 tasks based on CPU/memory

### Database

- **RDS PostgreSQL 15.4**: Managed database service
- **Instance Class**: db.t3.micro (configurable)
- **Storage**: 20GB encrypted with AES256
- **Backups**: 7-day retention, automated daily backups
- **Multi-AZ**: Enabled for production environment

### Storage

- **S3 Bucket**: Encrypted storage for application assets
- **Versioning**: Enabled for data protection
- **Lifecycle Policies**: Automated archival and cleanup
- **CORS**: Configured for frontend access

### Security

- **Security Groups**: Restrict traffic between components
- **Secrets Manager**: Encrypted storage for sensitive data
- **IAM Roles**: Least privilege access for ECS tasks
- **Encryption**: At rest (S3, RDS) and in transit (TLS)

## Configuration Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region for deployment | us-east-1 |
| `environment` | Environment name | production |
| `project_name` | Project name for resource naming | it-ticket |
| `vpc_cidr` | VPC CIDR block | 10.0.0.0/16 |
| `db_instance_class` | RDS instance type | db.t3.micro |
| `ecs_task_cpu` | CPU units for ECS task | 512 |
| `ecs_task_memory` | Memory for ECS task (MB) | 1024 |
| `app_desired_count` | Number of ECS tasks | 1 |
| `app_min_capacity` | Min tasks for auto-scaling | 1 |
| `app_max_capacity` | Max tasks for auto-scaling | 4 |

See `variables.tf` for the complete list of configurable variables.

## Cost Considerations

Estimated monthly costs (us-east-1, production):

- **ECS Fargate**: ~$15-30 (1-2 tasks running 24/7)
- **RDS db.t3.micro**: ~$15-20
- **NAT Gateway**: ~$32 (per AZ)
- **ALB**: ~$20
- **S3**: ~$1-5 (varies with usage)
- **Other**: ~$5-10 (CloudWatch, Secrets Manager, etc.)

**Total**: ~$88-120/month for minimal production setup

To reduce costs:
- Use staging environment with smaller instance types
- Reduce desired ECS task count
- Use single NAT Gateway (less resilient)
- Enable ECS Fargate Spot for non-critical workloads

## Database Management

### Connecting to RDS

Database credentials are stored in AWS Secrets Manager and automatically injected into ECS tasks.

To manually access the database:

1. Get the secret value:
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id it-ticket-db-credentials-production \
     --region us-east-1 \
     --query SecretString \
     --output text | jq -r .
   ```

2. Connect via bastion host or VPN (RDS is not publicly accessible)

### Backups

- **Automated Backups**: Daily at 3:00 AM UTC, 7-day retention
- **Manual Snapshots**: Create via AWS Console or CLI
- **Point-in-Time Recovery**: Enabled automatically

## Monitoring and Logs

### CloudWatch Logs

Application logs are streamed to CloudWatch:

```bash
aws logs tail /ecs/it-ticket-production --follow
```

### Container Insights

ECS Container Insights is enabled for metrics and monitoring.

View metrics in AWS Console:
- ECS → Clusters → it-ticket-cluster-production → Metrics

### Health Checks

- **Backend**: `/health` endpoint
- **Frontend**: Root path `/`
- **ALB**: Monitors target health every 30 seconds

## Troubleshooting

### ECS Tasks Not Starting

1. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/it-ticket-production --follow
   ```

2. Verify secrets are accessible:
   ```bash
   aws secretsmanager get-secret-value --secret-id it-ticket-db-credentials-production
   ```

3. Check ECS service events:
   ```bash
   aws ecs describe-services \
     --cluster it-ticket-cluster-production \
     --services it-ticket-service-production
   ```

### Database Connection Issues

1. Verify security group rules allow ECS → RDS traffic
2. Check RDS instance status in AWS Console
3. Verify DATABASE_URL is correctly constructed from secrets

### Application Not Accessible

1. Check ALB target health:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn <target-group-arn>
   ```

2. Verify ALB security group allows inbound HTTP (port 80)
3. Check ECS service is running desired number of tasks

## Cleanup

To destroy all infrastructure:

```bash
terraform destroy
```

**Warning**: This will delete all resources including the database. Ensure you have backups before proceeding.

For production environments:
1. Create RDS snapshot before destroying
2. Download S3 bucket contents
3. Export CloudWatch logs if needed

## Security Best Practices

1. **Secrets**: Never commit `terraform.tfvars` or state files
2. **State Backend**: Use S3 backend with state locking (DynamoDB)
3. **IAM**: Follow least privilege principle
4. **Network**: Keep database in private subnets
5. **Encryption**: Enable at rest and in transit
6. **Updates**: Regularly update Terraform and AWS provider versions
7. **Auditing**: Enable CloudTrail for API logging

## Additional Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

## Support

For issues or questions:
1. Check the main project [README](../README.md)
2. Review AWS service documentation
3. Open an issue in the GitHub repository
