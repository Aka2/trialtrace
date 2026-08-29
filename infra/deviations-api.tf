data "archive_file" "get_deviations_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/get-deviations.zip"
}

resource "aws_iam_role" "get_deviations_role" {
  name = "trialtrace-get-deviations-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "get_deviations_logs" {
  role       = aws_iam_role.get_deviations_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "get_deviations_dynamo" {
  name = "trialtrace-get-deviations-dynamo"
  role = aws_iam_role.get_deviations_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:Scan", "dynamodb:GetItem"]
      Resource = aws_dynamodb_table.trialtrace.arn
    }]
  })
}

resource "aws_lambda_function" "get_deviations" {
  function_name    = "trialtrace-get-deviations"
  role             = aws_iam_role.get_deviations_role.arn
  handler          = "getDeviations.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_deviations_zip.output_path
  source_code_hash = data.archive_file.get_deviations_zip.output_base64sha256
  timeout          = 15
}

resource "aws_apigatewayv2_integration" "get_deviations" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_deviations.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_deviations" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /deviations"
  target    = "integrations/${aws_apigatewayv2_integration.get_deviations.id}"
}

resource "aws_lambda_permission" "api_get_deviations" {
  statement_id  = "AllowAPIGatewayInvokeGetDeviations"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_deviations.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}