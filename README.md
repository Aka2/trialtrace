# TrialTrace

🇫🇷 [Lire en français](README_fr.md) · 📓 [Detailed project
journal](JOURNAL.md)

**Cloud-native clinical data review and protocol-compliance platform**

TrialTrace is a portfolio project exploring how modern cloud, AI and
deterministic rules can support clinical-data review. It centralizes
structured study data, surfaces deviations by severity, and demonstrates
a controlled AI extraction pipeline for unstructured clinical reports.

> **Data policy:** all data used in TrialTrace is synthetic. No real
> patient data is used.

## The problem

Clinical-study review can involve information scattered across reports,
sites and systems. This makes it harder to identify important deviations
quickly, prioritize critical cases and preserve a clear review trail.

TrialTrace explores a workflow where teams can:

-   review study-level indicators at a glance;
-   distinguish compliant records, minor deviations and critical
    deviations;
-   extract structured information from free-text reports;
-   validate AI output before it enters the application;
-   search and review study information;
-   apply different experiences for data managers and auditors.

## Architecture

``` text
                         ┌──────────────────────┐
                         │   React / TypeScript │
                         └──────────┬───────────┘
                                    │
                           CloudFront / HTTPS
                                    │
                              Private S3
                                    │
                                    ▼
                              API Gateway
                                    │
                 ┌──────────────────┴──────────────────┐
                 │                                     │
              Lambda                               Cognito
                 │                               Auth / RBAC
        ┌────────┼─────────┐
        │        │         │
    DynamoDB  Bedrock   OpenSearch*
```

`*` OpenSearch and several later product capabilities are implemented in
the project but their detailed journal sections are still being
reconstructed from the original development sessions.

Infrastructure is managed with Terraform. Frontend deployment is
automated through GitHub Actions using AWS OIDC federation.

## What currently works

-   React + TypeScript frontend deployed through CloudFront with a
    **private S3 origin and OAC**.
-   Terraform-managed AWS infrastructure with **remote
    encrypted/versioned state in S3**.
-   API Gateway + Lambda backend.
-   DynamoDB-backed dashboard with synthetic clinical-study data.
-   Severity dashboard showing compliant, minor and critical records.
-   Amazon Bedrock extraction flow that turns free-text clinical reports
    into structured JSON.
-   Deterministic validation of LLM output; invalid values are rejected
    instead of propagated.
-   Cognito authentication with `data-manager` and `auditor` roles.
-   Role-aware React UI.
-   GitHub Actions CI/CD authenticated to AWS through **OIDC --- no
    long-lived AWS deployment credentials stored in GitHub**.

Additional implemented product work includes search/OpenSearch,
deterministic compliance rules, configurable protocol behavior,
natural-language querying and bilingual UI. Their detailed documentation
is being consolidated into the project journal.

## AI safety boundary

TrialTrace deliberately separates probabilistic extraction from
deterministic validation:

``` text
Clinical text
     │
     ▼
Amazon Bedrock / LLM
     │ extracts
     ▼
Structured JSON
     │
     ▼
Deterministic validation
     │
     ├── valid   → accepted
     └── invalid → rejected (422)
```

For example, a test report containing an impossible hemoglobin value of
`950 g/dL` was correctly extracted by the model but rejected by
application validation.

> **The LLM extracts; deterministic code validates and enforces the
> rules that matter.**

## Security

The project applies several security-by-design practices:

-   root AWS account protected with MFA and not used for daily work;
-   least-privilege IAM roles;
-   private S3 frontend bucket;
-   CloudFront Origin Access Control;
-   HTTPS through CloudFront;
-   GitHub Actions → AWS authentication through OIDC federation;
-   Cognito authentication and JWT-based role information;
-   no demo passwords stored in version-controlled documentation.

The current RBAC implementation adapts the UI by role. **Server-side
JWT/RBAC enforcement is the next security hardening step**; hiding UI
actions alone is not treated as a security boundary.

## CI/CD

A push to `main` triggers:

``` text
git push
   │
   ▼
GitHub Actions
   ├── checkout
   ├── install Node dependencies
   ├── build React
   ├── obtain temporary AWS credentials through OIDC
   ├── sync build to S3
   └── invalidate CloudFront
```

The OIDC trust policy is restricted to the expected GitHub
repository/branch identity, while the deployment role only receives the
AWS permissions required for deployment.

## Data model

The learning dataset currently contains approximately:

  Metric                  Value
  --------------------- -------
  Reports / visits           90
  Compliant                  76
  Minor deviations           10
  Critical deviations         4
  Total deviations           14

The dataset is intentionally synthetic and includes known anomalies so
the application's behavior can be tested against expected results.

## Tech stack

  -----------------------------------------------------------------------
  Area                                Technologies
  ----------------------------------- -----------------------------------
  Frontend                            React, TypeScript, Vite, TanStack
                                      Query

  Cloud                               AWS Lambda, API Gateway, S3,
                                      CloudFront, DynamoDB, Cognito,
                                      Bedrock

  Search                              OpenSearch

  IaC                                 Terraform

  CI/CD                               GitHub Actions

  Authentication                      Cognito, JWT, OIDC

  Runtime                             Node.js

  Source control                      Git / GitHub
  -----------------------------------------------------------------------

## Repository structure

``` text
trialtrace/
├── .github/
│   └── workflows/
├── infra/              # Terraform + Lambda infrastructure/code
├── web/                # React + TypeScript application
├── README.md
├── README.fr.md
└── JOURNAL.md          # Detailed project/learning journal
```

## Local frontend development

Prerequisites: Node.js and npm.

``` bash
cd web
npm install
npm run dev
```

Vite prints the local development URL.

Production build:

``` bash
npm run build
```

## Infrastructure workflow

From `infra/`:

``` bash
terraform init
terraform plan
terraform apply
```

Do not run `terraform destroy` blindly: the project uses a remote S3
backend and some resources, especially paid services such as OpenSearch,
require deliberate lifecycle/cost management.

## Key lessons

-   Infrastructure should be reproducible rather than dependent on
    console clicks.
-   IAM roles have two distinct sides: **who may assume the role** and
    **what it may do once assumed**.
-   DynamoDB is modelled around access patterns rather than relational
    joins.
-   OIDC removes the need for long-lived AWS credentials in CI/CD.
-   UI RBAC improves UX, but real authorization must be enforced
    server-side.
-   LLM output must be treated as untrusted input and validated
    deterministically.

## Documentation

The detailed learning and engineering history --- including commands,
failures, debugging and interview notes --- lives in:

**[JOURNAL.md](JOURNAL.md)**

The French project overview is available in:

**[README.fr.md](README.fr.md)**

## Status / next hardening work

Current priorities include:

-   enforce Cognito JWT and role authorization on the API;
-   complete the audit trail;
-   consolidate detailed documentation for OpenSearch, compliance rules,
    natural-language querying and i18n;
-   continue robustness and observability work.

## Portfolio summary

> Built a cloud-native clinical-data review application on AWS with
> Terraform-managed infrastructure, React/TypeScript frontend,
> serverless APIs, DynamoDB, Amazon Bedrock extraction with
> deterministic validation, Cognito RBAC, and GitHub Actions CI/CD
> authenticated through OIDC federation.
