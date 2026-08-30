data "archive_file" "audit_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/audit.zip"
}

resource "aws_iam_role" "audit_role" {
  name = "trialtrace-audit-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow", Action = "sts:AssumeRole",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "audit_logs" {
  role       = aws_iam_role.audit_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "audit_dynamo" {
  name = "trialtrace-audit-dynamo"
  role = aws_iam_role.audit_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem", "dynamodb:Query"]
      Resource = aws_dynamodb_table.trialtrace.arn
    }]
  })
}

# --- Lambda : émettre une query ---
resource "aws_lambda_function" "emit_query" {
  function_name    = "trialtrace-emit-query"
  role             = aws_iam_role.audit_role.arn
  handler          = "emitQuery.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.audit_zip.output_path
  source_code_hash = data.archive_file.audit_zip.output_base64sha256
  timeout          = 10
}

# --- Lambda : lire la piste d'audit ---
resource "aws_lambda_function" "get_audit" {
  function_name    = "trialtrace-get-audit"
  role             = aws_iam_role.audit_role.arn
  handler          = "getAudit.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.audit_zip.output_path
  source_code_hash = data.archive_file.audit_zip.output_base64sha256
  timeout          = 10
}

# --- Routes (protégées par l'authorizer) ---
resource "aws_apigatewayv2_integration" "emit_query" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.emit_query.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_route" "emit_query" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "POST /query"
  target             = "integrations/${aws_apigatewayv2_integration.emit_query.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_integration" "get_audit" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_audit.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_route" "get_audit" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "GET /audit"
  target             = "integrations/${aws_apigatewayv2_integration.get_audit.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "api_emit_query" {
  statement_id  = "AllowInvokeEmitQuery"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.emit_query.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
resource "aws_lambda_permission" "api_get_audit" {
  statement_id  = "AllowInvokeGetAudit"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_audit.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}