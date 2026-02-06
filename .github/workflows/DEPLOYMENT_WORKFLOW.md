# AWS Deployment Workflow Guide

This document explains how to deploy the IT Ticket Management System to AWS using the automated GitHub Actions workflow.

## Overview

The deployment workflow automates the entire process of provisioning AWS infrastructure and deploying the application using:

1. **Terraform** for Infrastructure as Code
2. **AWS ECS Fargate** for container orchestration
3. **Amazon ECR** for Docker image storage
4. **GitHub Actions** for CI/CD automation

## Prerequisites

Before running the deployment workflow, ensure you have:

### 1. AWS Account and Credentials

You need an AWS account with an IAM user that has the following permissions:
- VPC, EC2, ECS, ECR management
- RDS, S3, Secrets Manager access
- IAM role creation and management
- Application Load Balancer management
- CloudWatch Logs access

### 2. GitHub Secrets Configuration

Configure these secrets in your GitHub repository:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region for deployment | `us-east-1` |

### 3. Repository Setup

Ensure the repository has:
- Terraform configuration in `terraform/` directory
- Docker files for backend and frontend
- GitHub Actions workflow at `.github/workflows/deploy.yml`

## Running the Deployment

### Step 1: Navigate to GitHub Actions

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Deploy to AWS** from the workflow list

### Step 2: Trigger the Workflow

Click **Run workflow** and configure the deployment:

#### Workflow Inputs

**Environment** (required)
- `staging`: Deploy to staging environment
- `production`: Deploy to production environment

**Terraform Action** (required)
- `plan`: Preview infrastructure changes without applying them
- `apply`: Apply infrastructure changes and deploy the application

**Version** (optional)
- Leave empty to deploy the latest commit
- Specify a git tag or branch name to deploy a specific version
- Example: `v1.0.0`, `feature/new-feature`, `main`

### Step 3: Monitor Deployment

The workflow consists of the following steps:

1. **Checkout Code**: Retrieves the specified version from the repository
2. **Configure AWS Credentials**: Sets up AWS access using GitHub secrets
3. **Setup Terraform**: Installs Terraform CLI
4. **Terraform Init**: Initializes Terraform working directory
5. **Terraform Format Check**: Validates Terraform code formatting
6. **Terraform Validate**: Validates Terraform configuration syntax
7. **Terraform Plan**: Creates execution plan showing what will change
8. **Terraform Apply** (if action is 'apply'): Provisions/updates AWS infrastructure
9. **Get Terraform Outputs**: Retrieves infrastructure details (ALB DNS, ECR URLs, etc.)
10. **Login to Amazon ECR**: Authenticates with container registry
11. **Build and Push Backend**: Builds backend Docker image and pushes to ECR
12. **Build and Push Frontend**: Builds frontend Docker image and pushes to ECR
13. **Update ECS Service**: Triggers deployment of new images to ECS
14. **Wait for Service Stability**: Ensures ECS service is running properly
15. **Run Smoke Tests**: Validates the deployment with health checks
16. **Deployment Summary**: Displays deployment results and application URL

### Step 4: View Deployment Results

After successful deployment, you'll see:

- **Application URL**: The ALB DNS name where your application is accessible
- **Backend Image**: ECR repository URL for the backend container
- **Frontend Image**: ECR repository URL for the frontend container
- **ECS Cluster**: Name of the ECS cluster
- **ECS Service**: Name of the ECS service

Example output:
```
Application URL: http://it-ticket-alb-production-123456789.us-east-1.elb.amazonaws.com
Backend Image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/it-ticket-backend-production:latest
Frontend Image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/it-ticket-frontend-production:latest
```

## Workflow Details

### Terraform Plan vs Apply

#### When to use `plan`

Use `plan` to:
- Preview infrastructure changes before applying
- Review cost estimates
- Validate configuration changes
- Share proposed changes with team

The `plan` action will:
- Show what resources will be created, updated, or destroyed
- Display estimated costs
- Complete without making any actual changes

#### When to use `apply`

Use `apply` to:
- Deploy new infrastructure
- Update existing infrastructure
- Deploy application changes
- Scale resources

The `apply` action will:
- Create/update AWS resources as defined in Terraform
- Build and push Docker images
- Deploy containers to ECS
- Run smoke tests

### Environment Selection

#### Staging Environment

Use for:
- Testing new features
- Integration testing
- Pre-production validation
- Training environments

Characteristics:
- Lower resource allocation
- Relaxed deletion protection
- Cost-optimized configuration
- Suitable for development and testing

#### Production Environment

Use for:
- Live application serving real users
- Production workloads
- Customer-facing deployments

Characteristics:
- Higher resource allocation
- Deletion protection enabled
- Multi-AZ for high availability
- Enhanced backup and monitoring

## Troubleshooting

### Common Issues

#### 1. Terraform Plan Fails

**Symptoms**: Workflow fails during Terraform plan step

**Possible Causes**:
- Invalid Terraform syntax
- Missing required variables
- AWS credential issues
- Resource quota limits

**Solutions**:
- Review Terraform configuration files
- Check GitHub secrets are correctly set
- Verify AWS account permissions
- Check AWS service quotas

#### 2. Docker Build Fails

**Symptoms**: Workflow fails during image build step

**Possible Causes**:
- Docker build errors
- Missing dependencies
- Build timeout

**Solutions**:
- Test Docker build locally
- Review Docker logs in workflow output
- Check Dockerfile syntax
- Ensure all dependencies are specified

#### 3. ECR Push Fails

**Symptoms**: Cannot push images to ECR

**Possible Causes**:
- ECR repository doesn't exist
- Authentication issues
- Network connectivity problems

**Solutions**:
- Ensure Terraform created ECR repositories
- Verify AWS credentials have ECR permissions
- Check ECR repository policies

#### 4. ECS Service Won't Stabilize

**Symptoms**: Service fails health checks

**Possible Causes**:
- Application crashes on startup
- Database connection issues
- Secrets Manager access denied
- Security group misconfiguration

**Solutions**:
- Check CloudWatch logs for errors
- Verify Secrets Manager secrets exist
- Check security group rules
- Review ECS task definition

#### 5. Smoke Tests Fail

**Symptoms**: Health checks fail after deployment

**Possible Causes**:
- Application not ready
- ALB target health check failing
- Network routing issues

**Solutions**:
- Wait longer for application startup
- Check ALB target group health
- Verify security groups allow traffic
- Review application logs

### Getting Workflow Logs

To view detailed logs:

1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click on the **Deploy to [environment]** job
4. Expand each step to view logs
5. Use the search feature to find specific errors

### Manual Rollback

If deployment fails and you need to rollback:

1. Re-run the workflow with a previous version tag
2. Or manually update ECS service to use previous task definition:

```bash
aws ecs update-service \
  --cluster it-ticket-cluster-production \
  --service it-ticket-service-production \
  --task-definition it-ticket-task-production:PREVIOUS_VERSION \
  --force-new-deployment
```

## Security Best Practices

### Protecting Secrets

- Never commit AWS credentials to Git
- Rotate IAM access keys regularly
- Use least-privilege IAM policies
- Enable MFA for AWS root account
- Review GitHub secret access logs

### Infrastructure Security

- Review Terraform plans before applying
- Use staging environment for testing
- Enable deletion protection for production
- Regular security audits
- Keep Terraform and providers updated

### Deployment Security

- Use specific version tags for production
- Review Docker image scans in ECR
- Monitor CloudWatch for anomalies
- Set up AWS CloudTrail for auditing
- Configure SNS alerts for failures

## Cost Management

### Monitoring Costs

The deployment creates the following billable resources:

- ECS Fargate tasks (hourly)
- RDS instance (hourly)
- NAT Gateways (hourly + data transfer)
- Application Load Balancer (hourly + LCUs)
- S3 storage (monthly + requests)
- CloudWatch Logs (storage + ingestion)
- Data transfer (egress)

**Estimated Monthly Cost**:
- Staging: ~$50-80
- Production: ~$100-150

### Cost Optimization

To reduce costs:

1. **Use Fargate Spot** for non-critical environments
2. **Schedule downtime** for staging (use Lambda to stop/start)
3. **Reduce desired task count** when not in use
4. **Use CloudWatch Log retention policies** (7 days for dev)
5. **Enable S3 lifecycle policies** for old data
6. **Use single NAT Gateway** for staging (less resilient but cheaper)

### Cleanup Resources

To completely remove infrastructure and stop costs:

```bash
cd terraform
terraform destroy
```

**Warning**: This deletes all resources including the database. Create backups first!

## Next Steps

After successful deployment:

1. **Configure Custom Domain**:
   - Point your domain to the ALB DNS name
   - Set up Route 53 or your DNS provider
   - Configure SSL/TLS certificate

2. **Enable HTTPS**:
   - Request certificate in AWS Certificate Manager
   - Add HTTPS listener to ALB
   - Update security groups for port 443

3. **Set Up Monitoring**:
   - Configure CloudWatch alarms
   - Set up SNS notifications
   - Create custom dashboards

4. **Configure Backups**:
   - Verify RDS automated backups
   - Set up S3 cross-region replication
   - Test backup restoration procedures

5. **Performance Tuning**:
   - Review CloudWatch metrics
   - Adjust auto-scaling policies
   - Optimize database queries

## Additional Resources

- [Main AWS Deployment Guide](../AWS_DEPLOYMENT.md)
- [Terraform Configuration](../terraform/README.md)
- [CI/CD Pipeline Documentation](../CICD.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
