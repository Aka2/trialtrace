terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "trialtrace-tfstate-a6705ek23"
    key     = "infra/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}

provider "aws" {
  region = "eu-west-1"
}

resource "aws_s3_bucket" "site" {
  bucket = "trialtrace-tf-a6705ek23"
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "trialtrace-tfstate-a6705ek23"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}