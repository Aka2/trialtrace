# --- Intégration : relier l'API à la Lambda get-subject ---
resource "aws_apigatewayv2_integration" "get_subject" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_subject.invoke_arn
  payload_format_version = "2.0"
}

# --- Route : GET /subjects/{id} ---
resource "aws_apigatewayv2_route" "get_subject" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /subjects/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.get_subject.id}"
}

# --- Autoriser l'API à invoquer la Lambda ---
resource "aws_lambda_permission" "api_get_subject" {
  statement_id  = "AllowAPIGatewayInvokeGetSubject"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_subject.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}