# --- Empaqueter (même dossier lambda) ---
data "archive_file" "extract_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/extract.zip"
}

# --- Rôle IAM ---
resource "aws_iam_role" "extract_role" {
  name = "trialtrace-extract-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "extract_logs" {
  role       = aws_iam_role.extract_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Permission : invoquer le modèle Bedrock ---
resource "aws_iam_role_policy" "extract_bedrock" {
  name = "trialtrace-extract-bedrock"
  role = aws_iam_role.extract_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["bedrock:InvokeModel"]
      Resource = [
        "arn:aws:bedrock:eu-west-1:730763716314:inference-profile/eu.anthropic.claude-haiku-4-5-20251001-v1:0",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0"
      ]
    }]
  })
}

# --- La Lambda ---
resource "aws_lambda_function" "extract" {
  function_name    = "trialtrace-extract"
  role             = aws_iam_role.extract_role.arn
  handler          = "extract.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.extract_zip.output_path
  source_code_hash = data.archive_file.extract_zip.output_base64sha256
  timeout          = 30
}

# --- Intégration + route POST /extract ---
resource "aws_apigatewayv2_integration" "extract" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.extract.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "extract" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /extract"
  target    = "integrations/${aws_apigatewayv2_integration.extract.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_extract" {
  statement_id  = "AllowAPIGatewayInvokeExtract"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.extract.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}