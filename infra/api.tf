# --- 1. L'API HTTP elle-même ---
resource "aws_apigatewayv2_api" "http_api" {
  name          = "trialtrace-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST",  "PUT", "OPTIONS"]
    allow_headers = ["*"]
  }
}
# --- 2. Le stage : le "déploiement" qui rend l'API accessible ---
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# --- 3. L'intégration : relier l'API à la Lambda ---
resource "aws_apigatewayv2_integration" "hello" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.hello.invoke_arn
  payload_format_version = "2.0"
}

# --- 4. La route : GET /hello pointe vers l'intégration ---
resource "aws_apigatewayv2_route" "hello" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /hello"
  target    = "integrations/${aws_apigatewayv2_integration.hello.id}"
}

# --- 5. Autoriser l'API à invoquer la Lambda ---
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hello.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# --- 6. Afficher l'URL à la fin ---
output "api_url" {
  value = "${aws_apigatewayv2_stage.default.invoke_url}hello"
}