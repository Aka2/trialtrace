data "archive_file" "protocol_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/protocol.zip"
}

# --- Rôle partagé par les deux Lambdas protocole ---
resource "aws_iam_role" "protocol_role" {
  name = "trialtrace-protocol-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "protocol_logs" {
  role       = aws_iam_role.protocol_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "protocol_dynamo" {
  name = "trialtrace-protocol-dynamo"
  role = aws_iam_role.protocol_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
      Resource = aws_dynamodb_table.trialtrace.arn
    }]
  })
}

# --- Lambda GET protocol ---
resource "aws_lambda_function" "get_protocol" {
  function_name    = "trialtrace-get-protocol"
  role             = aws_iam_role.protocol_role.arn
  handler          = "getProtocol.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.protocol_zip.output_path
  source_code_hash = data.archive_file.protocol_zip.output_base64sha256
  timeout          = 10
}

# --- Lambda UPDATE protocol ---
resource "aws_lambda_function" "update_protocol" {
  function_name    = "trialtrace-update-protocol"
  role             = aws_iam_role.protocol_role.arn
  handler          = "updateProtocol.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.protocol_zip.output_path
  source_code_hash = data.archive_file.protocol_zip.output_base64sha256
  timeout          = 10
}

# --- Routes ---
resource "aws_apigatewayv2_integration" "get_protocol" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_protocol.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_route" "get_protocol" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /protocol"
  target    = "integrations/${aws_apigatewayv2_integration.get_protocol.id}"
}

resource "aws_apigatewayv2_integration" "update_protocol" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.update_protocol.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_route" "update_protocol" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "PUT /protocol"
  target    = "integrations/${aws_apigatewayv2_integration.update_protocol.id}"
}

resource "aws_lambda_permission" "api_get_protocol" {
  statement_id  = "AllowInvokeGetProtocol"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_protocol.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
resource "aws_lambda_permission" "api_update_protocol" {
  statement_id  = "AllowInvokeUpdateProtocol"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_protocol.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}