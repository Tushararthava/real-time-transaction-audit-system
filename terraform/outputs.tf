output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.audit_server.public_ip
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.audit_server.id
}

output "security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.audit_sg.id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.audit_vpc.id
}

output "subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.audit_public_subnet.id
}

output "app_url" {
  description = "Application URL (HTTP)"
  value       = "http://${aws_instance.audit_server.public_ip}:3000"
}
