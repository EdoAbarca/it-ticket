variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name to use for resource naming"
  type        = string
  default     = "it-ticket"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = string
  default     = "512"
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = string
  default     = "1024"
}

variable "backend_container_cpu" {
  description = "CPU units for backend container"
  type        = number
  default     = 256
}

variable "backend_container_memory" {
  description = "Memory for backend container in MB"
  type        = number
  default     = 512
}

variable "frontend_container_cpu" {
  description = "CPU units for frontend container"
  type        = number
  default     = 256
}

variable "frontend_container_memory" {
  description = "Memory for frontend container in MB"
  type        = number
  default     = 512
}

variable "backend_port" {
  description = "Backend application port"
  type        = number
  default     = 3000
}

variable "frontend_port" {
  description = "Frontend application port"
  type        = number
  default     = 80
}

variable "app_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "app_min_capacity" {
  description = "Minimum number of ECS tasks for autoscaling"
  type        = number
  default     = 1
}

variable "app_max_capacity" {
  description = "Maximum number of ECS tasks for autoscaling"
  type        = number
  default     = 4
}

variable "health_check_path" {
  description = "Health check path for ALB target group"
  type        = string
  default     = "/health"
}

variable "jwt_secret" {
  description = "JWT secret for application authentication"
  type        = string
  sensitive   = true
  default     = ""
}

variable "email_host" {
  description = "Email SMTP host"
  type        = string
  default     = "smtp.example.com"
}

variable "email_port" {
  description = "Email SMTP port"
  type        = number
  default     = 587
}

variable "email_user" {
  description = "Email SMTP username"
  type        = string
  default     = ""
  sensitive   = true
}

variable "email_password" {
  description = "Email SMTP password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "email_from" {
  description = "Email from address"
  type        = string
  default     = "noreply@example.com"
}
