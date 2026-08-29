resource "aws_opensearch_domain" "trialtrace" {
  domain_name    = "trialtrace"
  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type  = "t3.small.search"
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 10
  }

  # Accès ouvert pour le dev — on sécurisera via IAM sur la Lambda
  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::730763716314:root" }
      Action    = "es:*"
      Resource  = "arn:aws:es:eu-west-1:730763716314:domain/trialtrace/*"
    }]
  })

  tags = {
    Project = "TrialTrace"
  }
}

output "opensearch_endpoint" {
  value = aws_opensearch_domain.trialtrace.endpoint
}