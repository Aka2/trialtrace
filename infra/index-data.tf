data "archive_file" "index_data_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/index-data.zip"
}

resource "aws_iam_role" "index_data_role" {
  name = "trialtrace-index-data-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "index_data_logs" {
  role       = aws_iam_role.index_data_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Permission : lire DynamoDB + écrire dans OpenSearch
resource "aws_iam_role_policy" "index_data_perms" {
  name = "trialtrace-index-data-perms"
  role = aws_iam_role.index_data_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "dynamodb:Scan"
        Resource = aws_dynamodb_table.trialtrace.arn
      },
      {
        Effect   = "Allow"
        Action   = ["es:ESHttpPut", "es:ESHttpPost", "es:ESHttpGet"]
        Resource = "${aws_opensearch_domain.trialtrace.arn}/*"
      }
    ]
  })
}

resource "aws_lambda_function" "index_data" {
  function_name    = "trialtrace-index-data"
  role             = aws_iam_role.index_data_role.arn
  handler          = "indexData.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.index_data_zip.output_path
  source_code_hash = data.archive_file.index_data_zip.output_base64sha256
  timeout          = 60

  environment {
    variables = {
      OS_ENDPOINT = aws_opensearch_domain.trialtrace.endpoint
    }
  }
}