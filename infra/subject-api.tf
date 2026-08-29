# --- Empaqueter le code (inclut node_modules) ---
data "archive_file" "get_subject_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/get-subject.zip"
}

# --- Rôle IAM de la Lambda ---
resource "aws_iam_role" "get_subject_role" {
  name = "trialtrace-get-subject-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# --- Permission : écrire les logs ---
resource "aws_iam_role_policy_attachment" "get_subject_logs" {
  role       = aws_iam_role.get_subject_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Permission : LIRE dans DynamoDB (moindre privilège : Query uniquement) ---
resource "aws_iam_role_policy" "get_subject_dynamo" {
  name = "trialtrace-get-subject-dynamo"
  role = aws_iam_role.get_subject_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "dynamodb:Query"
      Resource = aws_dynamodb_table.trialtrace.arn
    }]
  })
}

# --- La Lambda ---
resource "aws_lambda_function" "get_subject" {
  function_name    = "trialtrace-get-subject"
  role             = aws_iam_role.get_subject_role.arn
  handler          = "getSubject.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_subject_zip.output_path
  source_code_hash = data.archive_file.get_subject_zip.output_base64sha256
  timeout          = 10
}