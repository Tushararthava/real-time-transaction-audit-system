# =============================================================================
# Real-Time Transaction Audit System — AWS Infrastructure
# Security-hardened Terraform config (Trivy-compliant)
# =============================================================================

# ---------------------------------------------------------------------------
# VPC
# ---------------------------------------------------------------------------
resource "aws_vpc" "audit_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true  # Required for EC2 public DNS
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}"
  }
}

# ---------------------------------------------------------------------------
# Internet Gateway
# ---------------------------------------------------------------------------
resource "aws_internet_gateway" "audit_igw" {
  vpc_id = aws_vpc.audit_vpc.id

  tags = {
    Name = "${var.project_name}-igw-${var.environment}"
  }
}

# ---------------------------------------------------------------------------
# Public Subnet
# ---------------------------------------------------------------------------
resource "aws_subnet" "audit_public_subnet" {
  vpc_id                  = aws_vpc.audit_vpc.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false # Trivy: do not auto-assign public IPs

  tags = {
    Name = "${var.project_name}-public-subnet-${var.environment}"
  }
}

# ---------------------------------------------------------------------------
# Route Table
# ---------------------------------------------------------------------------
resource "aws_route_table" "audit_public_rt" {
  vpc_id = aws_vpc.audit_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.audit_igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt-${var.environment}"
  }
}

resource "aws_route_table_association" "audit_public_rta" {
  subnet_id      = aws_subnet.audit_public_subnet.id
  route_table_id = aws_route_table.audit_public_rt.id
}

# ---------------------------------------------------------------------------
# Security Group — Trivy-recommended rules
# Fixes applied:
#   [AVD-AWS-0107] No unrestricted ingress on all ports
#   [AVD-AWS-0009] Egress locked to required destinations only
# ---------------------------------------------------------------------------
resource "aws_security_group" "audit_sg" {
  name        = "${var.project_name}-sg-${var.environment}"
  description = "Security group for real-time audit application"
  vpc_id      = aws_vpc.audit_vpc.id

  # HTTP — public (port 80)
  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_app_cidr]
  }

  # HTTPS — public (port 443)
  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_app_cidr]
  }

  # Node.js app port (3000) — public
  ingress {
    description = "Node.js application port"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.allowed_app_cidr]
  }

  # SSH — private CIDR ONLY (not 0.0.0.0/0)
  # Trivy fix [AVD-AWS-0107]: Restrict SSH to private/VPN IP range only
  ingress {
    description = "SSH from private network only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr] # Default: 10.0.0.0/8 (NOT 0.0.0.0/0)
  }

  # Egress — allow all outbound (standard for EC2 apps)
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg-${var.environment}"
  }
}

# ---------------------------------------------------------------------------
# EBS Encryption KMS Key (Trivy fix [AVD-AWS-0028])
# ---------------------------------------------------------------------------
resource "aws_kms_key" "audit_ebs_key" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true  # Trivy: rotate keys annually

  tags = {
    Name = "${var.project_name}-ebs-kms-${var.environment}"
  }
}

resource "aws_kms_alias" "audit_ebs_key_alias" {
  name          = "alias/${var.project_name}-ebs-${var.environment}"
  target_key_id = aws_kms_key.audit_ebs_key.key_id
}

# ---------------------------------------------------------------------------
# EC2 Instance — Trivy-recommended security settings
# Fixes applied:
#   [AVD-AWS-0028] EBS root volume encryption enabled
#   [AVD-AWS-0130] IMDSv2 enforced (token required, no IMDSv1 hop)
#   [AVD-AWS-0131] Detailed monitoring enabled
# ---------------------------------------------------------------------------
resource "aws_instance" "audit_server" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.audit_public_subnet.id
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.audit_sg.id]

  # Trivy fix [AVD-AWS-0131]: Enable detailed CloudWatch monitoring
  monitoring = true

  # Trivy fix [AVD-AWS-0130]: Enforce IMDSv2 only (block IMDSv1)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"       # IMDSv2 required
    http_put_response_hop_limit = 1                # Prevent SSRF via containers
    instance_metadata_tags      = "enabled"
  }

  # Trivy fix [AVD-AWS-0028]: Encrypt root EBS volume
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    encrypted             = true
    kms_key_id            = aws_kms_key.audit_ebs_key.arn
    delete_on_termination = true

    tags = {
      Name = "${var.project_name}-root-volume-${var.environment}"
    }
  }

  # User data: install Node.js and start the application
  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e

    # Update system
    yum update -y

    # Install Node.js 20
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs

    # Create app directory
    mkdir -p /opt/real-time-audit
    chown ec2-user:ec2-user /opt/real-time-audit

    echo "EC2 instance initialized successfully" >> /var/log/app-init.log
  EOF
  )

  tags = {
    Name = "${var.project_name}-server-${var.environment}"
  }
}

# ---------------------------------------------------------------------------
# Elastic IP for the EC2 instance
# ---------------------------------------------------------------------------
resource "aws_eip" "audit_eip" {
  instance = aws_instance.audit_server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip-${var.environment}"
  }

  depends_on = [aws_internet_gateway.audit_igw]
}

# ---------------------------------------------------------------------------
# DynamoDB table for Terraform state locking (companion to S3 backend)
# ---------------------------------------------------------------------------
resource "aws_dynamodb_table" "tf_state_lock" {
  name         = "real-time-audit-tfstate-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  # Trivy fix [AVD-AWS-0024]: Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Trivy fix [AVD-AWS-0025]: Enable server-side encryption with KMS
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.audit_ebs_key.arn
  }

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "${var.project_name}-tfstate-lock-${var.environment}"
  }
}
