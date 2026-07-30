# --- 1. Empaqueter le code en .zip (Lambda veut un zip) ---
data "archive_file" "hello_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/hello.zip"
}

# --- 2. Le rôle IAM : "qui" la Lambda a le droit d'être ---
resource "aws_iam_role" "lambda_role" {
  name = "trialtrace-hello-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# --- 3. Autoriser la Lambda à écrire ses logs dans CloudWatch ---
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- 4. La fonction Lambda elle-même ---
resource "aws_lambda_function" "hello" {
  function_name    = "trialtrace-hello"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.hello_zip.output_path
  source_code_hash = data.archive_file.hello_zip.output_base64sha256
}