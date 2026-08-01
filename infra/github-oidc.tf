# --- 1. Déclarer que AWS fait confiance au fournisseur d'identité de GitHub ---
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["ffffffffffffffffffffffffffffffffffffffff"]
}

# --- 2. Le rôle que GitHub Actions pourra endosser ---
resource "aws_iam_role" "github_deploy" {
  name = "trialtrace-github-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        # LE VERROU : uniquement depuis TON dépôt, branche main
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:Aka2/trialtrace:*"
        }
      }
    }]
  })
}

# --- 3. Les permissions : juste ce qu'il faut pour déployer ---
resource "aws_iam_role_policy" "github_deploy" {
  name = "trialtrace-deploy-policy"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Écrire les fichiers du site dans le bucket
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.frontend.arn,
          "${aws_s3_bucket.frontend.arn}/*"
        ]
      },
      {
        # Rafraîchir le cache CloudFront après déploiement
        Effect   = "Allow"
        Action   = "cloudfront:CreateInvalidation"
        Resource = aws_cloudfront_distribution.frontend.arn
      }
    ]
  })
}

# --- 4. Afficher l'ARN du rôle (on en aura besoin pour GitHub) ---
output "github_role_arn" {
  value = aws_iam_role.github_deploy.arn
}