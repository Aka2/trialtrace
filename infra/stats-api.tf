# --- Empaqueter (on réutilise le même dossier lambda) ---
data "archive_file" "get_stats_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/get-stats.zip"
}

# --- Rôle IAM ---
resource "aws_iam_role" "get_stats_role" {
  name = "trialtrace-get-stats-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "get_stats_logs" {
  role       = aws_iam_role.get_stats_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Permission : Scan sur la table (lecture) ---
resource "aws_iam_role_policy" "get_stats_dynamo" {
  name = "trialtrace-get-stats-dynamo"
  role = aws_iam_role.get_stats_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:Scan", "dynamodb:GetItem"]
      Resource = aws_dynamodb_table.trialtrace.arn
    }]
  })
}

# --- La Lambda ---
resource "aws_lambda_function" "get_stats" {
  function_name    = "trialtrace-get-stats"
  role             = aws_iam_role.get_stats_role.arn
  handler          = "getStats.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_stats_zip.output_path
  source_code_hash = data.archive_file.get_stats_zip.output_base64sha256
  timeout          = 10
}

# --- Intégration + route GET /stats ---
resource "aws_apigatewayv2_integration" "get_stats" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_stats.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_stats" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /stats"
  target    = "integrations/${aws_apigatewayv2_integration.get_stats.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_get_stats" {
  statement_id  = "AllowAPIGatewayInvokeGetStats"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_stats.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}