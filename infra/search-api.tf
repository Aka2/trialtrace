data "archive_file" "search_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/search.zip"
}

resource "aws_iam_role" "search_role" {
  name = "trialtrace-search-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "search_logs" {
  role       = aws_iam_role.search_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "search_os" {
  name = "trialtrace-search-os"
  role = aws_iam_role.search_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["es:ESHttpGet", "es:ESHttpPost"]
      Resource = "${aws_opensearch_domain.trialtrace.arn}/*"
    }]
  })
}

resource "aws_lambda_function" "search" {
  function_name    = "trialtrace-search"
  role             = aws_iam_role.search_role.arn
  handler          = "search.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.search_zip.output_path
  source_code_hash = data.archive_file.search_zip.output_base64sha256
  timeout          = 15

  environment {
    variables = {
      OS_ENDPOINT = aws_opensearch_domain.trialtrace.endpoint
    }
  }
}

resource "aws_apigatewayv2_integration" "search" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.search.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "search" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /search"
  target    = "integrations/${aws_apigatewayv2_integration.search.id}"
}

resource "aws_lambda_permission" "api_search" {
  statement_id  = "AllowAPIGatewayInvokeSearch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}