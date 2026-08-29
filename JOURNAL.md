# TrialTrace --- Journal de projet détaillé

🇬🇧 [Project README in English](README.md) · 🇫🇷 [README
français](README.fr.md)

> Ce fichier est le carnet de bord détaillé du projet : sessions de
> travail, commandes, erreurs, décisions, tests et apprentissages. Pour
> une présentation synthétique du projet, voir le README.

------------------------------------------------------------------------

# TrialTrace --- Journal de projet

## Présentation du projet

**TrialTrace** est une application web de revue et de conformité pour
les données d'essais cliniques.

Son objectif est d'aider les équipes qui supervisent des études
cliniques à centraliser les informations importantes, repérer rapidement
les écarts au protocole et suivre les éléments qui nécessitent une
action.

L'application doit permettre, à terme, de :

-   consulter les rapports et résultats d'une étude clinique ;
-   identifier les écarts critiques ou mineurs ;
-   suivre leur statut ;
-   conserver une trace claire des actions réalisées ;
-   faciliter la revue des données par les équipes qualité, data
    management et opérations cliniques ;
-   sécuriser et automatiser le déploiement de la plateforme sur AWS.

------------------------------------------------------------------------

## Problème auquel TrialTrace répond

Dans un essai clinique, les données proviennent souvent de plusieurs
centres, outils et rapports.

Cela peut créer plusieurs difficultés :

-   informations dispersées ;
-   détection tardive d'un écart au protocole ;
-   manque de visibilité sur les anomalies prioritaires ;
-   suivi manuel dans des fichiers ou tableaux séparés ;
-   difficulté à retrouver qui a fait quoi et quand ;
-   risque d'erreur lors du déploiement ou de la gestion de
    l'infrastructure.

TrialTrace cherche à regrouper ces informations dans une interface
claire, afin qu'un utilisateur puisse voir rapidement :

``` text
Ce qui est conforme
Ce qui doit être examiné
Ce qui est critique
Ce qui nécessite une action immédiate
```

L'idée centrale est de transformer une revue de données potentiellement
lente et fragmentée en un processus plus lisible, traçable et
automatisé.

------------------------------------------------------------------------

## Utilisateurs visés

Les principaux utilisateurs envisagés sont :

-   les gestionnaires de données cliniques ;
-   les équipes qualité ;
-   les responsables d'étude ;
-   les équipes de suivi des centres ;
-   les profils DevOps ou cloud responsables du déploiement de la
    plateforme.

------------------------------------------------------------------------

## Vision fonctionnelle

L'interface cible présente notamment :

-   un tableau de bord synthétique ;
-   le nombre de rapports traités ;
-   le taux de conformité ;
-   les déviations mineures ;
-   les écarts critiques ;
-   une liste d'écarts à examiner ;
-   des actions comme « Examiner », « Émettre une query » ou « Voir le
    détail » ;
-   une piste d'audit ;
-   une recherche par participant, centre ou étude.

Les données utilisées pendant le développement sont synthétiques et ne
correspondent à aucun patient réel.

------------------------------------------------------------------------

## Vision technique

TrialTrace est construit comme une application cloud moderne et
reproductible.

Architecture actuelle :

``` text
React + TypeScript
        │
        ▼
Build Vite
        │
        ▼
S3 privé
        │
        ▼
CloudFront
        │
        ▼
Application web HTTPS
```

Pour l'API :

``` text
Navigateur
    │
    ▼
API Gateway
    │
    ▼
Lambda Node.js
```

L'infrastructure est décrite avec Terraform et déployée automatiquement
avec GitHub Actions.

Les principes techniques du projet sont :

-   infrastructure as code ;
-   automatisation ;
-   sécurité par défaut ;
-   permissions minimales ;
-   absence de clés AWS permanentes dans GitHub ;
-   déploiements reproductibles ;
-   traçabilité des changements.

------------------------------------------------------------------------

## Objectif pédagogique du projet

TrialTrace est aussi un projet d'apprentissage progressif.

Il permet de pratiquer :

-   AWS ;
-   Terraform ;
-   IAM ;
-   Lambda ;
-   API Gateway ;
-   S3 ;
-   CloudFront ;
-   React ;
-   TypeScript ;
-   GitHub Actions ;
-   OIDC ;
-   CI/CD.

Le projet avance étape par étape, depuis la création manuelle de
ressources AWS jusqu'à une plateforme entièrement déployée par code.

------------------------------------------------------------------------

## Parcours du projet

``` text
Étape 1 — Découvrir AWS manuellement
Étape 2 — Recréer l’infrastructure avec Terraform
Étape 3 — Déployer le front React avec S3 et CloudFront
Étape 4 — Automatiser le déploiement avec GitHub Actions et OIDC
Étape 5 — Approfondir IAM
Étape 6 — Ajouter une base de données
Étapes suivantes — enrichir les fonctionnalités métier et l’observabilité
```

------------------------------------------------------------------------

# JOURNAL.md --- Jour 1 : Découverte d'AWS

## Objectif

Créer une première architecture Serverless AWS en utilisant uniquement
la console AWS afin de comprendre les principaux services avant de les
automatiser avec Terraform.

------------------------------------------------------------------------

# 1. Sécurisation du compte AWS

## Actions réalisées

-   Création du compte AWS.
-   Activation de la MFA sur le compte Root.
-   Création d'un utilisateur IAM administrateur (`trialtrace-admin`).
-   Utilisation du compte IAM pour les opérations quotidiennes.
-   Le compte Root est réservé aux tâches d'administration
    exceptionnelles.

**Pourquoi ?**

Bonne pratique AWS : ne jamais utiliser le compte Root au quotidien.

------------------------------------------------------------------------

# 2. Création d'un budget AWS

-   Nom : `trialtrace-budget`
-   Montant : **5 USD**

**Objectif :** Recevoir une alerte en cas de dépassement du budget.

------------------------------------------------------------------------

# 3. Création d'un bucket Amazon S3

Nom du bucket :

`trialtrace-dev-a13k01a02`

Configuration :

-   Usage général
-   ACL désactivées
-   Versioning désactivé
-   Chiffrement SSE-S3
-   Aucun tag

------------------------------------------------------------------------

# 4. Hébergement d'un site statique

Création d'un fichier `index.html` :

``` html
<!DOCTYPE html>
<html>
<head>
    <title>TrialTrace</title>
</head>
<body>
    <h1>Hello TrialTrace</h1>
</body>
</html>
```

Téléversement du fichier dans le bucket.

------------------------------------------------------------------------

# 5. Activation de l'hébergement statique S3

-   Hébergement statique : Activé
-   Document d'index : `index.html`

------------------------------------------------------------------------

# 6. Rendre le bucket public

## Désactivation du blocage de l'accès public

Le blocage global de l'accès public a été désactivé.

## Ajout de la Bucket Policy

``` json
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Sid":"PublicReadForStaticWebsite",
      "Effect":"Allow",
      "Principal":"*",
      "Action":"s3:GetObject",
      "Resource":"arn:aws:s3:::trialtrace-dev-a13k01a02/*"
    }
  ]
}
```

Le site devient accessible publiquement.

------------------------------------------------------------------------

# 7. Création d'une fonction Lambda

Nom : `trialtrace-hello`

Runtime : **Node.js 24.x**

Code :

``` javascript
export const handler = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Hello TrialTrace!"
        })
    };
};
```

------------------------------------------------------------------------

# 8. Test de la Lambda

Événement de test :

`hello-test`

Résultat :

``` json
{
  "statusCode": 200,
  "body": "{\"message\":\"Hello TrialTrace!\"}"
}
```

------------------------------------------------------------------------

# 9. Création d'une API HTTP (API Gateway)

-   API : `trialtrace-api`
-   Type : HTTP API
-   Intégration : Lambda
-   Fonction : `trialtrace-hello`

------------------------------------------------------------------------

# 10. Création de la route

-   Méthode : `GET`
-   Chemin : `/hello`
-   Cible : `trialtrace-hello`

------------------------------------------------------------------------

# 11. Déploiement

-   Étape : `$default`
-   Déploiement automatique : Activé

------------------------------------------------------------------------

# 12. Test de l'API

URL :

`https://ba6kt03kmc.execute-api.eu-west-1.amazonaws.com/hello`

Réponse :

``` json
{
  "message": "Hello TrialTrace!"
}
```

------------------------------------------------------------------------

# Architecture obtenue

## Site statique

``` text
Navigateur
      │
      ▼
Amazon S3
      │
      ▼
index.html
```

## API Serverless

``` text
Navigateur
      │
      ▼
API Gateway
      │
      ▼
AWS Lambda
      │
      ▼
Réponse JSON
```

------------------------------------------------------------------------

# Services AWS découverts

-   **IAM** : gestion des utilisateurs et des permissions.
-   **AWS Budgets** : suivi des coûts.
-   **Amazon S3** : stockage d'objets et hébergement de sites statiques.
-   **AWS Lambda** : exécution de code sans serveur.
-   **API Gateway** : exposition d'une API HTTP.

------------------------------------------------------------------------

# Difficultés rencontrées

-   Différence entre le compte Root et un utilisateur IAM.
-   Configuration d'un bucket S3 public.
-   Mise en place d'une Bucket Policy.
-   Compréhension du lien entre API Gateway et Lambda.
-   Différence entre le test direct d'une Lambda et son appel via une
    API.

------------------------------------------------------------------------

# Ce que j'ai appris

-   Sécuriser un compte AWS.
-   Héberger un site statique avec S3.
-   Comprendre les politiques d'accès S3.
-   Déployer une fonction Lambda Node.js.
-   Tester une Lambda.
-   Connecter API Gateway à Lambda.
-   Publier une API HTTP accessible sur Internet.
-   Comprendre les bases d'une architecture Serverless.

------------------------------------------------------------------------

# Prochaine étape

Reproduire cette architecture entièrement avec **Terraform** afin de
pouvoir la créer avec :

``` bash
terraform apply
```

et la supprimer proprement avec :

``` bash
terraform destroy
```

------------------------------------------------------------------------

# JOURNAL.md --- Jour 2 : Premiers pas avec Terraform sur Windows

## Objectif

Installer les outils nécessaires, connecter Terraform au compte AWS,
créer un premier bucket S3 avec du code Terraform et comprendre le rôle
du fichier `terraform.tfstate`.

------------------------------------------------------------------------

# 1. Comprendre Terraform

Terraform permet de décrire l'infrastructure souhaitée dans des fichiers
`.tf` au lieu de créer les ressources manuellement dans la console AWS.

Terraform compare :

-   le code Terraform, qui décrit ce que je veux ;
-   le state, qui mémorise ce que Terraform connaît déjà ;
-   l'infrastructure réellement présente sur AWS.

Il calcule ensuite les changements nécessaires pour faire correspondre
l'infrastructure réelle à la configuration écrite.

## Commandes principales

``` powershell
terraform init
terraform plan
terraform apply
terraform destroy
```

-   `terraform init` prépare le dossier et télécharge les providers
    nécessaires.
-   `terraform plan` montre les changements prévus sans les exécuter.
-   `terraform apply` crée ou modifie réellement les ressources.
-   `terraform destroy` supprime les ressources gérées par Terraform.

------------------------------------------------------------------------

# 2. Création des clés d'accès AWS

Une paire de clés a été créée pour l'utilisateur IAM `trialtrace-admin`
:

-   Access Key ID ;
-   Secret Access Key.

## Règles de sécurité retenues

-   Ne jamais placer les clés dans le projet.
-   Ne jamais les publier dans Git.
-   Ne jamais les afficher dans une capture d'écran.
-   Supprimer immédiatement une clé exposée et en créer une nouvelle.
-   Stocker les clés uniquement via `aws configure`, dans le dossier
    caché `.aws`.

------------------------------------------------------------------------

# 3. Installation d'AWS CLI sur Windows

Commande utilisée :

``` powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

Après l'installation, PowerShell a été fermé puis rouvert afin que
Windows recharge le `PATH`.

Vérification :

``` powershell
aws --version
```

## Problème rencontré

La commande `aws` n'était pas reconnue immédiatement après
l'installation.

## Solution

Fermer complètement PowerShell, ouvrir une nouvelle fenêtre puis
relancer `aws --version`.

------------------------------------------------------------------------

# 4. Installation de Terraform

Terraform a été installé avec `winget` :

``` powershell
winget install HashiCorp.Terraform
```

Vérification :

``` powershell
terraform --version
```

------------------------------------------------------------------------

# 5. Configuration d'AWS CLI

Commande utilisée :

``` powershell
aws configure
```

Valeurs configurées :

-   AWS Access Key ID : clé de l'utilisateur IAM ;
-   AWS Secret Access Key : clé secrète ;
-   région par défaut : `eu-west-1` ;
-   format de sortie : `json`.

Vérification de l'identité :

``` powershell
aws sts get-caller-identity
```

Un bloc JSON contenant le numéro du compte AWS et l'identité
`trialtrace-admin` s'est affiché. Cela confirme qu'AWS CLI et Terraform
peuvent communiquer avec le compte AWS.

------------------------------------------------------------------------

# 6. Création du dossier Terraform

``` powershell
cd ~
mkdir trialtrace
cd trialtrace
mkdir infra
cd infra
```

Le code Terraform est placé dans :

``` text
trialtrace/infra
```

Ouverture du dossier avec Visual Studio Code :

``` powershell
code .
```

------------------------------------------------------------------------

# 7. Création du premier fichier `main.tf`

``` hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
}

resource "aws_s3_bucket" "site" {
  bucket = "trialtrace-tf-IDENTIFIANT-UNIQUE"
}
```

## Signification des blocs

-   Le bloc `terraform` déclare le provider AWS nécessaire.
-   Le bloc `provider "aws"` indique la région AWS utilisée.
-   Le bloc `resource "aws_s3_bucket" "site"` demande la création d'un
    bucket S3.
-   Le mot `site` est le nom interne de la ressource dans Terraform.
-   Le nom réel du bucket doit être unique dans tout AWS.

------------------------------------------------------------------------

# 8. Premier cycle Terraform

``` powershell
terraform init
terraform plan
terraform apply
```

Résultat attendu du plan :

``` text
Plan: 1 to add, 0 to change, 0 to destroy
```

Après confirmation avec `yes`, Terraform crée le bucket S3, qui peut
ensuite être vérifié dans la console AWS.

------------------------------------------------------------------------

# 9. Comprendre `main.tf` et `terraform.tfstate`

> Le fichier `main.tf` décrit ce que je veux ; le fichier
> `terraform.tfstate`, géré automatiquement par Terraform, mémorise ce
> que Terraform connaît déjà de l'infrastructure créée.

À chaque `terraform plan`, Terraform compare l'intention avec sa mémoire
afin de calculer les actions nécessaires.

## Expérience réalisée avec le state

Lorsque le state est caché ou absent :

-   Terraform voit toujours dans `main.tf` qu'un bucket est demandé ;
-   il ne sait plus qu'il l'a déjà créé ;
-   il propose donc de le créer à nouveau avec `1 to add`.

## Leçon retenue

Perdre le state ne supprime pas les ressources AWS, mais Terraform perd
le lien entre son code et les ressources existantes.

------------------------------------------------------------------------

# 10. Pourquoi déplacer le state dans S3

Le state local présente plusieurs limites :

-   le disque peut tomber en panne ;
-   le state n'est pas disponible depuis une autre machine ;
-   GitHub Actions ne pourra pas facilement l'utiliser ;
-   le travail en équipe serait difficile.

La prochaine étape consiste à créer un bucket S3 dédié au state, avec le
versioning activé.

Configuration prévue :

``` hcl
resource "aws_s3_bucket" "tfstate" {
  bucket = "trialtrace-tfstate-IDENTIFIANT-UNIQUE"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}
```

Le versioning permettra de restaurer une ancienne version du state en
cas de problème.

------------------------------------------------------------------------

# 11. État d'avancement

## Réalisé

-   Compréhension du principe de Terraform.
-   Création des clés d'accès AWS.
-   Installation d'AWS CLI et de Terraform.
-   Configuration d'AWS CLI.
-   Vérification de l'identité IAM avec STS.
-   Création du dossier `trialtrace/infra`.
-   Création du premier fichier `main.tf`.
-   Compréhension du cycle `init`, `plan` et `apply`.
-   Création d'un premier bucket S3 avec Terraform.
-   Compréhension de la différence entre `main.tf` et
    `terraform.tfstate`.

## À reprendre lors de la prochaine session

-   Ajouter le bucket S3 destiné au state.
-   Activer le versioning.
-   Exécuter `terraform apply`.
-   Configurer le backend S3.
-   Migrer le state local vers le bucket distant.

------------------------------------------------------------------------

# Phrase à retenir

## \> Terraform lit dans `main.tf` ce que je veux, utilise `terraform.tfstate` pour savoir ce qu'il connaît déjà, puis applique uniquement la différence.

# JOURNAL.md --- Jour 3 : Backend S3, Lambda et API Gateway avec Terraform

## Objectif

Finaliser l'étape 2 en :

-   stockant le state Terraform dans un bucket S3 distant ;
-   créant une fonction Lambda avec Terraform ;
-   créant une API Gateway reliée à cette Lambda ;
-   obtenant une infrastructure reproductible uniquement à partir du
    code.

------------------------------------------------------------------------

# 1. Création du bucket destiné au state Terraform

Le fichier `terraform.tfstate` était jusque-là stocké localement dans le
dossier `infra`.

Cette solution pose plusieurs problèmes :

-   le disque de l'ordinateur peut tomber en panne ;
-   le state n'est pas facilement accessible depuis une autre machine ;
-   une future pipeline GitHub Actions ne pourra pas l'utiliser
    directement ;
-   le travail en équipe serait difficile.

Un deuxième bucket S3 a donc été créé pour stocker le state :

``` hcl
resource "aws_s3_bucket" "tfstate" {
  bucket = "trialtrace-tfstate-a6705ek23"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}
```

Le versioning permet de conserver plusieurs versions du fichier state et
de revenir à une version précédente en cas de problème.

Commande exécutée :

``` powershell
terraform apply
```

Résultat obtenu :

``` text
2 added
```

Les deux éléments créés étaient :

1.  le bucket S3 destiné au state ;
2.  l'activation du versioning sur ce bucket.

------------------------------------------------------------------------

# 2. Configuration du backend S3

Le bloc `terraform` de `main.tf` a été complété avec un backend S3 :

``` hcl
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
```

Signification des paramètres :

-   `bucket` : nom du bucket qui stocke le state ;
-   `key` : chemin du fichier state à l'intérieur du bucket ;
-   `region` : région AWS du bucket ;
-   `encrypt = true` : demande le chiffrement du state stocké dans S3.

Le nom du bucket déclaré dans le backend doit être exactement identique
au nom réel du bucket créé sur AWS.

------------------------------------------------------------------------

# 3. Migration du state local vers S3

Après l'ajout du backend, la commande suivante a été exécutée :

``` powershell
terraform init
```

Terraform a détecté le changement de backend et a proposé de copier le
state existant vers S3.

Réponse donnée :

``` text
yes
```

Résultat obtenu :

``` text
Successfully configured the backend "s3"!
```

Le state est désormais lu et écrit dans :

``` text
s3://trialtrace-tfstate-a6705ek23/infra/terraform.tfstate
```

## Vérification

Commande exécutée :

``` powershell
terraform plan
```

Résultat :

``` text
No changes. Your infrastructure matches the configuration.
```

Cela confirme que Terraform retrouve correctement les ressources déjà
créées grâce au state distant.

Dans la console AWS, le fichier suivant est visible dans le bucket :

``` text
infra/terraform.tfstate
```

## Correction importante

Lorsque le backend S3 est activé, le fichier state principal n'est plus
utilisé localement. Terraform conserve toutefois des fichiers techniques
dans le dossier `.terraform`. Il ne faut donc pas se fier uniquement à
la présence ou à l'absence d'un fichier `terraform.tfstate` local pour
vérifier la migration ; la meilleure vérification reste `terraform plan`
ainsi que la présence du state dans S3.

------------------------------------------------------------------------

# 4. Différence entre le nom réel et le nom interne d'une ressource

Exemple :

``` hcl
resource "aws_s3_bucket" "tfstate" {
  bucket = "trialtrace-tfstate-a6705ek23"
}
```

Dans cet exemple :

-   `tfstate` est le nom interne utilisé dans le code Terraform ;
-   `trialtrace-tfstate-a6705ek23` est le véritable nom du bucket sur
    AWS.

Le nom interne permet de référencer la ressource ailleurs :

``` hcl
aws_s3_bucket.tfstate.id
```

Le nom réel doit être unique dans AWS.

------------------------------------------------------------------------

# 5. Fichier `main.tf` complet à cette étape

``` hcl
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
```

------------------------------------------------------------------------

# 6. Création du code de la Lambda

Un sous-dossier a été créé dans `infra` :

``` text
infra/lambda
```

Le fichier suivant a été créé :

``` text
infra/lambda/index.mjs
```

Contenu :

``` javascript
export const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello TrialTrace!"
    })
  };
};
```

L'extension `.mjs` indique à Node.js que le fichier utilise le système
de modules moderne avec `export`.

------------------------------------------------------------------------

# 7. Création du fichier `lambda.tf`

Le fichier `lambda.tf` contient les ressources nécessaires à la fonction
Lambda.

``` hcl
data "archive_file" "hello_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/hello.zip"
}

resource "aws_iam_role" "lambda_role" {
  name = "trialtrace-hello-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"

      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "hello" {
  function_name = "trialtrace-hello"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = data.archive_file.hello_zip.output_path
  source_code_hash = data.archive_file.hello_zip.output_base64sha256
}
```

------------------------------------------------------------------------

# 8. Rôle des blocs de `lambda.tf`

## `archive_file`

``` hcl
data "archive_file" "hello_zip"
```

Ce bloc compresse le dossier `lambda` dans un fichier ZIP.

AWS Lambda attend un package de déploiement, ici :

``` text
hello.zip
```

Il s'agit d'une source de données Terraform, pas d'une ressource AWS
créée dans le compte.

## `aws_iam_role`

Ce rôle répond à la question :

> Qui a le droit d'endosser ce rôle ?

La réponse est :

``` text
lambda.amazonaws.com
```

Cela signifie que le service AWS Lambda peut utiliser ce rôle.

## `aws_iam_role_policy_attachment`

Ce bloc attache la politique gérée par AWS :

``` text
AWSLambdaBasicExecutionRole
```

Elle permet à la Lambda d'écrire ses logs dans CloudWatch Logs.

## `aws_lambda_function`

Ce bloc crée la fonction Lambda et relie :

-   le code ZIP ;
-   le runtime Node.js ;
-   le handler ;
-   le rôle IAM ;
-   le hash du code.

Le paramètre :

``` hcl
handler = "index.handler"
```

signifie :

-   utiliser le fichier `index.mjs` ;
-   appeler la fonction exportée nommée `handler`.

Le paramètre `source_code_hash` permet à Terraform de détecter les
modifications du code et de redéployer la Lambda lorsque le ZIP change.

------------------------------------------------------------------------

# 9. Comprendre les deux parties d'un rôle IAM

Un rôle IAM répond à deux questions différentes.

## Qui peut utiliser le rôle ?

Réponse donnée par l'`assume_role_policy`.

Dans ce projet :

``` text
AWS Lambda
```

## Que peut faire le rôle ?

Réponse donnée par les politiques attachées.

Dans ce projet :

``` text
écrire les logs dans CloudWatch Logs
```

Phrase à retenir :

> L'Assume Role Policy définit qui peut prendre le rôle ; les policies
> définissent ce que ce rôle permet de faire.

Cette séparation applique le principe du moindre privilège : donner
seulement les permissions nécessaires.

------------------------------------------------------------------------

# 10. Initialisation et création de la Lambda

Comme le code utilise le provider `archive`, une nouvelle initialisation
a été exécutée :

``` powershell
terraform init
```

Puis :

``` powershell
terraform plan
terraform apply
```

Terraform a créé les ressources AWS nécessaires :

-   le rôle IAM ;
-   l'attachement de politique IAM ;
-   la fonction Lambda.

La source de données `archive_file` a généré le ZIP localement, mais
elle ne constitue pas une ressource AWS supplémentaire.

Après l'application, la fonction suivante est apparue dans la console
Lambda :

``` text
trialtrace-hello
```

Le test de la fonction a retourné :

``` json
{
  "statusCode": 200,
  "body": "{\"message\":\"Hello TrialTrace!\"}"
}
```

------------------------------------------------------------------------

# 11. Création du fichier `api.tf`

Le fichier `api.tf` contient l'API HTTP et son intégration avec la
Lambda.

``` hcl
resource "aws_apigatewayv2_api" "http_api" {
  name          = "trialtrace-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "hello" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.hello.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "hello" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /hello"
  target    = "integrations/${aws_apigatewayv2_integration.hello.id}"
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hello.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

output "api_url" {
  value = "${aws_apigatewayv2_stage.default.invoke_url}hello"
}
```

------------------------------------------------------------------------

# 12. Rôle des blocs de `api.tf`

## API HTTP

``` hcl
aws_apigatewayv2_api
```

Crée une API Gateway de type HTTP.

## Stage `$default`

``` hcl
aws_apigatewayv2_stage
```

Rend l'API accessible et publie automatiquement les modifications grâce
à :

``` hcl
auto_deploy = true
```

## Intégration Lambda

``` hcl
aws_apigatewayv2_integration
```

Relie API Gateway à la Lambda.

Le type :

``` hcl
integration_type = "AWS_PROXY"
```

indique qu'API Gateway transmet la requête à la Lambda et utilise sa
réponse comme réponse HTTP.

## Route

``` hcl
route_key = "GET /hello"
```

Cette route signifie qu'une requête HTTP `GET` vers `/hello` déclenche
la Lambda.

## Permission Lambda

``` hcl
aws_lambda_permission
```

Par défaut, API Gateway n'a pas le droit d'invoquer une fonction Lambda.

Cette ressource donne explicitement au service :

``` text
apigateway.amazonaws.com
```

le droit d'exécuter :

``` text
lambda:InvokeFunction
```

sur la fonction `trialtrace-hello`.

Phrase à retenir :

> Sur AWS, le fait de relier deux services ne suffit pas : le service
> appelant doit aussi recevoir une permission explicite.

## Output

``` hcl
output "api_url"
```

Affiche automatiquement l'adresse publique de l'API après un
`terraform apply`.

------------------------------------------------------------------------

# 13. Déploiement de l'API

Commande exécutée :

``` powershell
terraform apply
```

Terraform a créé :

-   l'API HTTP ;
-   le stage `$default` ;
-   l'intégration Lambda ;
-   la route `GET /hello` ;
-   la permission permettant à API Gateway d'appeler la Lambda.

À la fin, Terraform a affiché l'URL publique de l'API.

------------------------------------------------------------------------

# 14. Erreur PowerShell rencontrée

Après l'`apply`, le texte suivant affiché par Terraform a été recopié
dans PowerShell :

``` text
Outputs:
api_url = "..."
```

PowerShell a tenté d'interpréter ces lignes comme des commandes et a
affiché des erreurs en rouge.

Ce n'était pas une erreur Terraform.

## Leçon retenue

Les lignes de la section `Outputs` sont des résultats à lire ou à
copier, pas des commandes à exécuter.

Pour réafficher les outputs plus tard, utiliser :

``` powershell
terraform output
```

Pour afficher uniquement l'URL :

``` powershell
terraform output -raw api_url
```

------------------------------------------------------------------------

# 15. Correction du double slash dans l'URL

L'output initial produisait :

``` text
https://ghnwqzu301.execute-api.eu-west-1.amazonaws.com//hello
```

Le problème venait du fait que `invoke_url` se terminait déjà par `/`.

La configuration initiale ajoutait un deuxième slash :

``` hcl
value = "${aws_apigatewayv2_stage.default.invoke_url}/hello"
```

La correction a été :

``` hcl
output "api_url" {
  value = "${aws_apigatewayv2_stage.default.invoke_url}hello"
}
```

URL corrigée :

``` text
https://ghnwqzu301.execute-api.eu-west-1.amazonaws.com/hello
```

Réponse obtenue dans le navigateur :

``` json
{
  "message": "Hello TrialTrace!"
}
```

------------------------------------------------------------------------

# 16. Architecture obtenue avec Terraform

``` text
Navigateur
      │
      │ GET /hello
      ▼
API Gateway HTTP API
      │
      │ autorisation explicite
      ▼
AWS Lambda
      │
      ▼
Réponse JSON
```

En parallèle :

``` text
Terraform
      │
      ├── lit les fichiers .tf
      ├── utilise le state distant
      ▼
Bucket S3 de state
      │
      ├── chiffrement
      └── versioning
```

------------------------------------------------------------------------

# 17. Structure du dossier Terraform

``` text
trialtrace/
└── infra/
    ├── main.tf
    ├── lambda.tf
    ├── api.tf
    ├── lambda/
    │   └── index.mjs
    ├── hello.zip
    ├── .terraform/
    └── .terraform.lock.hcl
```

Le fichier `hello.zip` est généré automatiquement à partir du dossier
`lambda`.

Le dossier `.terraform` et le fichier `.terraform.lock.hcl` sont
utilisés par Terraform pour les providers et leurs versions.

------------------------------------------------------------------------

# 18. Fichiers à ne pas envoyer dans Git

Un fichier `.gitignore` devra contenir au minimum :

``` gitignore
.terraform/
*.tfstate
*.tfstate.*
*.tfplan
crash.log
crash.*.log
hello.zip
```

Le fichier suivant doit normalement être conservé dans Git :

``` text
.terraform.lock.hcl
```

Il verrouille les versions précises des providers et aide à obtenir les
mêmes dépendances sur plusieurs machines.

Les clés AWS ne doivent jamais être écrites dans les fichiers Terraform
ni ajoutées à Git.

------------------------------------------------------------------------

# 19. Difficultés rencontrées

-   Comprendre pourquoi le state local devait être déplacé.
-   Comprendre le problème de l'œuf et de la poule : Terraform crée le
    bucket qui stockera ensuite son propre state.
-   Aligner exactement le nom du bucket du backend avec le bucket
    réellement créé.
-   Reconstituer le bloc `terraform` complet dans `main.tf`.
-   Comprendre le rôle de `archive_file`.
-   Comprendre les deux parties d'un rôle IAM.
-   Autoriser explicitement API Gateway à appeler Lambda.
-   Ne pas confondre les outputs Terraform avec des commandes
    PowerShell.
-   Corriger le double slash dans l'URL finale.

------------------------------------------------------------------------

# 20. Ce que j'ai appris

-   Créer un backend S3 pour Terraform.
-   Migrer un state local vers un state distant.
-   Vérifier la cohérence du backend avec `terraform plan`.
-   Activer le versioning d'un bucket de state.
-   Distinguer le nom interne Terraform du nom réel AWS.
-   Organiser le code Terraform dans plusieurs fichiers `.tf`.
-   Compresser automatiquement le code d'une Lambda.
-   Créer un rôle IAM et lui attacher une politique.
-   Déployer une Lambda avec Terraform.
-   Créer une API Gateway HTTP avec Terraform.
-   Créer une route `GET /hello`.
-   Donner à API Gateway la permission d'invoquer Lambda.
-   Utiliser un output Terraform.
-   Diagnostiquer une erreur d'affichage d'URL.

------------------------------------------------------------------------

# 21. Prochaine vérification : reproductibilité complète

Pour terminer l'étape 2, il reste à vérifier que l'infrastructure peut
être supprimée et recréée uniquement à partir du code.

Commande de suppression :

``` powershell
terraform destroy
```

Après vérification du plan, répondre :

``` text
yes
```

Puis recréer l'infrastructure :

``` powershell
terraform apply
```

Cette opération doit être réalisée avec prudence, car le bucket qui
contient le backend Terraform fait actuellement partie de la même
configuration que les autres ressources.

## Point de vigilance important

Terraform ne peut pas facilement détruire le bucket S3 qui contient le
state qu'il utilise au même moment. De plus, un bucket versionné
contenant le fichier state n'est pas vide et AWS refusera normalement sa
suppression.

Pour un projet réel, le backend doit idéalement être séparé dans une
petite configuration Terraform de bootstrap, ou être créé et géré
séparément de l'infrastructure principale.

Pour tester la reproductibilité sans casser le backend, la solution la
plus sûre est de ne détruire que les ressources applicatives :

-   le bucket du site ;
-   la Lambda ;
-   son rôle IAM ;
-   l'API Gateway ;
-   les permissions associées.

Le bucket de state doit rester en place.

------------------------------------------------------------------------

# 22. Phrase à retenir

> Mon code Terraform décrit l'infrastructure voulue, le backend S3
> conserve la mémoire de l'infrastructure existante, et Terraform
> applique seulement la différence entre les deux.

> Une relation technique entre deux services AWS ne suffit pas : il faut
> aussi donner explicitement au service appelant la permission
> d'utiliser le service appelé.

------------------------------------------------------------------------

# JOURNAL.md --- Jour 4 : Fin de Terraform et démarrage du front React

## Objectifs de la session

Cette session avait deux objectifs principaux :

1.  terminer réellement l'étape Terraform en vérifiant que
    l'infrastructure pouvait être détruite puis recréée ;
2.  démarrer l'étape 3 avec un premier projet React + TypeScript exécuté
    localement.

------------------------------------------------------------------------

# 1. Validation finale de l'étape Terraform

L'infrastructure complète est maintenant décrite en code Terraform.

Elle comprend :

-   un bucket S3 applicatif ;
-   un bucket S3 dédié au state Terraform ;
-   le versioning du bucket de state ;
-   une fonction AWS Lambda ;
-   un rôle IAM pour la Lambda ;
-   la politique permettant à la Lambda d'écrire dans CloudWatch Logs ;
-   une API Gateway HTTP ;
-   la route `GET /hello` ;
-   la permission permettant à API Gateway d'invoquer la Lambda ;
-   un output affichant l'URL publique de l'API.

L'API retourne :

``` json
{
  "message": "Hello TrialTrace!"
}
```

## Ce que cette étape démontre

L'infrastructure n'est plus un ensemble de manipulations réalisées
manuellement dans la console AWS.

Elle est désormais :

-   décrite dans des fichiers ;
-   versionnable dans Git ;
-   reproductible ;
-   partageable ;
-   modifiable de manière contrôlée ;
-   supprimable puis recréable à partir du même code.

Phrase à retenir :

> Mon infrastructure n'est plus une suite de clics difficiles à
> reproduire : elle est décrite comme du code.

------------------------------------------------------------------------

# 2. Test de destruction et de recréation

Commande de destruction :

``` powershell
terraform destroy
```

Terraform affiche d'abord le plan de suppression, puis demande une
confirmation.

Réponse :

``` text
yes
```

Les ressources applicatives gérées par Terraform sont alors supprimées.

Commande de recréation :

``` powershell
terraform apply
```

Après confirmation avec `yes`, Terraform reconstruit l'infrastructure à
partir des fichiers `.tf`.

L'identifiant généré par API Gateway peut changer, donc l'URL finale
peut être différente, mais le comportement reste identique :

``` json
{
  "message": "Hello TrialTrace!"
}
```

## Leçon retenue

`terraform destroy` puis `terraform apply` démontrent que
l'infrastructure est reproductible.

Phrase utilisable en entretien :

> I use Terraform to recreate the same infrastructure reliably. When an
> environment is not needed, I can destroy its resources and provision
> them again from version-controlled code.

## Point de vigilance sur le backend

Le bucket qui stocke le state Terraform doit être traité avec prudence.

Il ne faut pas supprimer sans précaution la ressource qui contient la
mémoire utilisée par Terraform au même moment.

Dans une architecture plus mature, le backend est généralement séparé de
l'infrastructure applicative dans une configuration de bootstrap dédiée.

------------------------------------------------------------------------

# 3. Synthèse de l'étape 2

## Ce que j'ai construit

J'ai créé avec Terraform :

-   S3 ;
-   Lambda ;
-   IAM ;
-   API Gateway ;
-   les permissions entre les services ;
-   le backend distant du state.

## Concept principal

``` text
Configuration Terraform
        │
        │ décrit ce que je veux
        ▼
Terraform plan
        │
        │ compare avec le state
        ▼
Infrastructure AWS
```

-   les fichiers `.tf` décrivent l'état désiré ;
-   le state mémorise les ressources connues de Terraform ;
-   `terraform plan` calcule la différence ;
-   `terraform apply` exécute cette différence.

## State distant

Le state est stocké dans Amazon S3 avec :

-   le chiffrement activé ;
-   le versioning activé ;
-   un chemin dédié : `infra/terraform.tfstate`.

## Problèmes rencontrés

### Incohérence du nom de bucket

Le nom configuré dans le backend ne correspondait pas exactement au nom
du bucket existant.

**Solution :** aligner toutes les occurrences avec le véritable nom du
bucket AWS.

### Conflit avec une ressource créée manuellement

La Lambda du premier jour avait été créée manuellement et pouvait entrer
en conflit avec la Lambda déclarée dans Terraform.

**Solution :** supprimer ou importer la ressource existante avant de
laisser Terraform la gérer.

### Double slash dans l'URL

L'URL affichée contenait :

``` text
//hello
```

**Solution :** retirer le slash supplémentaire dans l'output Terraform.

### Output recopié dans PowerShell

Les lignes de sortie de Terraform ont été recopiées dans le terminal
comme si elles étaient des commandes.

**Solution :** lire ou copier l'URL vers le navigateur, ou utiliser :

``` powershell
terraform output -raw api_url
```

------------------------------------------------------------------------

# 4. Avancement global du parcours

``` text
✅ Étape 1 — Découverte du cloud avec la console AWS
✅ Étape 2 — Infrastructure as Code avec Terraform
➡️ Étape 3 — Front React déployé avec S3 et CloudFront
```

------------------------------------------------------------------------

# 5. Vérification et installation de Node.js

React et Vite nécessitent Node.js.

Commande de vérification :

``` powershell
node --version
```

Lorsque Node.js n'est pas installé, il peut être ajouté avec :

``` powershell
winget install OpenJS.NodeJS.LTS
```

Après installation ou mise à jour, PowerShell doit être fermé puis
rouvert afin de recharger le `PATH`.

Une incompatibilité de version a été rencontrée entre Node.js et la
version de Vite utilisée.

Le problème a été résolu en mettant Node.js à jour vers une version
compatible.

## Leçon retenue

Lorsqu'un outil de build affiche une erreur de moteur ou de module
natif, il faut vérifier la compatibilité entre :

-   la version de Node.js ;
-   la version de Vite ;
-   les dépendances installées.

Phrase utilisable en entretien :

> I diagnosed a build-tool compatibility issue between Node.js and Vite,
> upgraded the runtime, and verified the project again.

------------------------------------------------------------------------

# 6. Création du projet React avec Vite

Le front a été créé à côté du dossier `infra`, afin de séparer le code
applicatif de l'infrastructure.

Structure souhaitée :

``` text
trialtrace/
├── infra/
└── web/
```

Commande utilisée depuis la racine du projet :

``` powershell
npm create vite@latest web -- --template react-ts
```

La version de Vite utilisée a affiché un menu interactif.

Choix effectués :

``` text
Framework : React
Variant   : TypeScript
```

Le choix `Vanilla` n'a pas été conservé, car il aurait créé une
application JavaScript sans React.

------------------------------------------------------------------------

# 7. Installation des dépendances

Après la création du dossier `web` :

``` powershell
cd web
npm install
```

Cette commande installe les dépendances et crée le dossier :

``` text
node_modules
```

Ce dossier ne doit pas être ajouté dans Git.

Entrées à prévoir dans `.gitignore` :

``` gitignore
node_modules/
dist/
```

------------------------------------------------------------------------

# 8. Lancement du serveur de développement

Commande utilisée :

``` powershell
npm run dev
```

Vite affiche ensuite une adresse locale semblable à :

``` text
http://localhost:5173/
```

Le serveur de développement :

-   exécute l'application React localement ;
-   surveille les modifications ;
-   recharge automatiquement l'interface après une sauvegarde.

Ce mécanisme est appelé `hot reload`.

Pour arrêter le serveur :

``` text
Ctrl + C
```

Pour le relancer :

``` powershell
npm run dev
```

------------------------------------------------------------------------

# 9. Fichiers principaux du projet React

Dans le dossier `src`, les deux premiers fichiers modifiés sont :

``` text
src/App.tsx
src/App.css
```

-   `App.tsx` contient la structure de l'écran ;
-   `App.css` contient son apparence visuelle.

Le projet peut être ouvert dans Visual Studio Code avec :

``` powershell
code .
```

------------------------------------------------------------------------

# 10. Premier écran TrialTrace

## `src/App.tsx`

``` tsx
import './App.css'

function App() {
  return (
    <div className="app">
      <div className="brand">
        <div className="mark">TT</div>

        <div className="name">
          TrialTrace
          <span>Data Review</span>
        </div>
      </div>

      <p className="tagline">
        Revue centralisée des données d'essais cliniques
      </p>
    </div>
  )
}

export default App
```

## `src/App.css`

``` css
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a4a4a;
  font-family: system-ui, sans-serif;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mark {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #12a5a5;
  color: #fff;
  font-weight: 700;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.name {
  color: #fff;
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  text-align: left;
}

.name span {
  display: block;
  margin-top: 4px;
  color: #7fb3b3;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.tagline {
  color: #b5d6d6;
  font-size: 15px;
}
```

Après sauvegarde des fichiers, le navigateur s'est mis à jour
automatiquement.

Le premier écran TrialTrace s'est affiché correctement.

------------------------------------------------------------------------

# 11. Direction artistique retenue

La direction artistique recherchée pour TrialTrace est :

-   clinique et sérieuse, sans être froide ;
-   claire et rassurante ;
-   sobre, mais pas austère ;
-   orientée vers la revue et la prise de décision ;
-   adaptée à l'affichage de tableaux et de données médicales.

## Palette principale

-   teal profond pour l'identité et la navigation ;
-   blanc pour les espaces de travail ;
-   vert pour les éléments conformes ;
-   ambre pour les déviations mineures ;
-   rouge pour les écarts critiques ;
-   bleu nuit pour les titres et le texte principal.

## Principes d'interface

-   beaucoup d'espace blanc ;
-   peu d'éléments simultanément ;
-   hiérarchie visuelle claire ;
-   une action principale identifiable ;
-   alertes repérables en une seconde ;
-   grandes zones de lecture pour les tableaux de revue.

------------------------------------------------------------------------

# 12. Choix du logo TrialTrace

Trois pistes de logo ont été étudiées.

Le premier logo a été retenu :

-   carré arrondi teal ;
-   monogramme blanc ;
-   nom `TrialTrace` en bleu nuit ;
-   mention `DATA REVIEW` en teal.

## Pourquoi ce choix ?

Cette version est la plus polyvalente :

-   lisible en petite taille ;
-   utilisable comme favicon ;
-   adaptée à une barre latérale ;
-   adaptée à une icône d'application ;
-   contrastée sur fond clair ou foncé ;
-   cohérente avec l'identité visuelle de l'interface.

Le logo a ensuite été recréé directement en SVG afin de disposer d'un
fichier :

-   vectoriel ;
-   net à toutes les tailles ;
-   léger ;
-   facilement modifiable ;
-   intégrable directement dans React.

Fichier créé :

``` text
trialtrace-logo.svg
```

## Leçon retenue

Une image générée par IA est utile pour explorer une idée, mais elle ne
garantit pas la reproduction exacte d'un logo à chaque génération.

Pour l'application finale, il faut figer le logo dans un fichier SVG
stable et réutiliser toujours ce même fichier.

------------------------------------------------------------------------

# 13. État actuel du projet

## Infrastructure

``` text
✅ S3
✅ Lambda
✅ IAM
✅ API Gateway
✅ Backend Terraform distant
✅ Infrastructure reproductible
```

## Front-end

``` text
✅ Node.js installé et compatible
✅ Projet React créé
✅ TypeScript activé
✅ Vite configuré
✅ Dépendances installées
✅ Serveur local fonctionnel
✅ Premier écran TrialTrace affiché
✅ Direction artistique définie
✅ Logo SVG choisi et créé
```

------------------------------------------------------------------------

# 14. Prochaine étape

La prochaine étape consiste à mettre l'application React en ligne.

Le processus sera :

``` text
Code React
    │
    ▼
npm run build
    │
    ▼
Fichiers statiques dans dist/
    │
    ▼
Bucket S3 privé
    │
    ▼
CloudFront
    │
    ▼
Application accessible en HTTPS
```

Commande de build à venir :

``` powershell
npm run build
```

Vite générera le dossier :

``` text
dist/
```

Ce dossier contiendra les fichiers optimisés destinés au déploiement.

L'infrastructure S3 + CloudFront sera ensuite décrite avec Terraform.

------------------------------------------------------------------------

# Phrase de synthèse

> J'ai terminé une infrastructure AWS reproductible avec Terraform, puis
> créé mon premier front React + TypeScript avec Vite. L'application
> fonctionne en local avec son identité visuelle TrialTrace et elle est
> prête à être construite puis déployée sur S3 et CloudFront.

------------------------------------------------------------------------

# JOURNAL.md --- Jour 5 : Build React et déploiement sur S3 + CloudFront

## Objectif de la session

Mettre le front React de TrialTrace en ligne sur AWS avec une
architecture propre et sécurisée :

``` text
React
  │
  ▼
Build Vite
  │
  ▼
Fichiers statiques
  │
  ▼
Bucket S3 privé
  │
  ▼
CloudFront
  │
  ▼
Site public en HTTPS
```

L'objectif est d'éviter le bucket S3 public utilisé lors du premier
exercice manuel.

Cette fois :

-   le bucket S3 reste privé ;
-   CloudFront est le seul service autorisé à lire les fichiers ;
-   le site est accessible publiquement en HTTPS via le CDN.

------------------------------------------------------------------------

# 1. Builder l'application React

Le site fonctionne d'abord localement avec :

``` powershell
npm run dev
```

Pour le déployer, il faut créer une version optimisée destinée à la
production.

Depuis le dossier `web` :

``` powershell
cd C:\Users\HP\Documents\Trialtrace_project\trialtrace\web
npm run build
```

Vite compile alors l'application et crée un dossier :

``` text
dist/
```

Ce dossier contient notamment :

``` text
dist/
├── index.html
└── assets/
    ├── fichiers JavaScript
    └── fichiers CSS
```

## Concept clé

Une application React buildée devient un ensemble de fichiers statiques
:

-   HTML ;
-   CSS ;
-   JavaScript ;
-   images et autres ressources.

Il n'y a pas de serveur React qui tourne en production dans cette
architecture.

Phrase à retenir :

> A React application builds into static HTML, CSS and JavaScript files,
> which is why it can be hosted on S3 behind a CDN.

------------------------------------------------------------------------

# 2. Pourquoi utiliser S3 avec CloudFront

Amazon S3 stocke les fichiers du site.

CloudFront se place devant le bucket et joue le rôle de CDN.

CloudFront apporte :

-   une URL publique ;
-   le HTTPS ;
-   la mise en cache ;
-   la distribution mondiale ;
-   un meilleur temps de chargement ;
-   une couche de sécurité devant le bucket.

Le bucket n'est pas directement exposé à Internet.

Architecture :

``` text
Utilisateur
    │
    │ HTTPS
    ▼
CloudFront
    │
    │ accès autorisé avec OAC
    ▼
Bucket S3 privé
    │
    ▼
index.html + assets
```

------------------------------------------------------------------------

# 3. Comprendre l'OAC

OAC signifie :

``` text
Origin Access Control
```

Il s'agit du mécanisme utilisé par CloudFront pour accéder à un bucket
S3 privé.

L'OAC permet de dire :

> Seule cette distribution CloudFront a le droit de lire les fichiers de
> ce bucket.

Cela évite de rendre le bucket public.

------------------------------------------------------------------------

# 4. Création du fichier `frontend.tf`

Un nouveau fichier Terraform est créé dans le dossier `infra` :

``` text
infra/frontend.tf
```

Contenu :

``` hcl
resource "aws_s3_bucket" "frontend" {
  bucket = "trialtrace-web-a6705ek23"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "trialtrace-oac"
  description                       = "OAC for the TrialTrace frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipalReadOnly"
      Effect    = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }

      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.frontend.arn}/*"

      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
        }
      }
    }]
  })
}

output "site_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
```

## Correction de sécurité importante

Pour un bucket réellement privé, les quatre protections doivent être
activées :

``` hcl
block_public_acls       = true
block_public_policy     = true
ignore_public_acls      = true
restrict_public_buckets = true
```

La policy du bucket n'est pas publique : elle autorise uniquement
CloudFront, avec une condition qui limite l'accès à la distribution
créée par Terraform.

------------------------------------------------------------------------

# 5. Création de l'infrastructure

Depuis le dossier `infra` :

``` powershell
terraform plan
terraform apply
```

Après vérification du plan, répondre :

``` text
yes
```

CloudFront peut prendre plusieurs minutes à être créé.

Il est normal de voir plusieurs messages :

``` text
Still creating...
```

À la fin, Terraform affiche une URL semblable à :

``` text
site_url = "https://xxxxx.cloudfront.net"
```

À ce stade :

-   le bucket existe ;
-   la distribution CloudFront existe ;
-   l'accès entre CloudFront et S3 est configuré ;
-   le bucket est encore vide.

L'URL peut donc afficher une erreur tant que les fichiers du front n'ont
pas été envoyés dans S3.

------------------------------------------------------------------------

# 6. Envoyer le build React dans S3

Depuis le dossier `web` :

``` powershell
cd C:\Users\HP\Documents\Trialtrace_project\trialtrace\web
```

Commande de synchronisation :

``` powershell
aws s3 sync dist/ s3://trialtrace-web-a6705ek23 --delete
```

Il faut remplacer le nom du bucket par le véritable nom créé dans
Terraform si le suffixe est différent.

## Signification de la commande

-   `aws s3 sync` synchronise un dossier local avec un bucket S3 ;
-   `dist/` est le dossier source contenant la version buildée ;
-   `s3://trialtrace-web-a6705ek23` est le bucket de destination ;
-   `--delete` supprime du bucket les anciens fichiers absents du
    nouveau build.

------------------------------------------------------------------------

# 7. Vérifier les fichiers envoyés

La commande affiche des lignes semblables à :

``` text
upload: dist/index.html to s3://...
upload: dist/assets/index-....js to s3://...
upload: dist/assets/index-....css to s3://...
```

Dans la console AWS, le bucket doit maintenant contenir :

``` text
index.html
assets/
```

Le bucket reste privé : il ne doit pas être ouvert directement avec une
URL S3.

------------------------------------------------------------------------

# 8. Ouvrir le site public

L'URL peut être récupérée avec :

``` powershell
terraform output -raw site_url
```

Elle ressemble à :

``` text
https://xxxxx.cloudfront.net
```

Cette URL doit afficher le premier écran TrialTrace en HTTPS.

Le site est désormais accessible depuis Internet.

------------------------------------------------------------------------

# 9. Cache CloudFront

CloudFront met les fichiers en cache.

Après un nouveau build et un nouveau `aws s3 sync`, il est possible de
voir encore l'ancienne version pendant quelque temps.

Solutions possibles :

``` text
Ctrl + Shift + R
```

Pour vider explicitement le cache CloudFront :

``` powershell
aws cloudfront create-invalidation --distribution-id ID_DE_LA_DISTRIBUTION --paths "/*"
```

Un output Terraform pourra être ajouté :

``` hcl
output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}
```

------------------------------------------------------------------------

# 10. Cycle de déploiement du front

À chaque modification importante du front :

``` powershell
cd web
npm run build
aws s3 sync dist/ s3://NOM_DU_BUCKET --delete
```

Puis, si nécessaire :

``` powershell
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

Cycle complet :

``` text
Modifier le code React
        │
        ▼
npm run build
        │
        ▼
dist/
        │
        ▼
aws s3 sync
        │
        ▼
S3 privé
        │
        ▼
CloudFront
        │
        ▼
Site mis à jour
```

------------------------------------------------------------------------

# 11. Ce que j'ai appris

-   builder une application React avec Vite ;
-   comprendre le rôle du dossier `dist` ;
-   comprendre qu'un build React produit des fichiers statiques ;
-   héberger ces fichiers dans S3 ;
-   garder le bucket privé ;
-   utiliser CloudFront comme CDN ;
-   forcer le HTTPS ;
-   utiliser une Origin Access Control ;
-   autoriser uniquement CloudFront à lire le bucket ;
-   gérer les routes React avec les erreurs `403` et `404` ;
-   synchroniser les fichiers avec AWS CLI ;
-   comprendre le cache CloudFront ;
-   invalider le cache après un nouveau déploiement.

------------------------------------------------------------------------

# 12. Différence avec le site S3 du jour 1

## Jour 1

``` text
Utilisateur
    │
    ▼
Bucket S3 public
```

Le bucket était directement exposé.

## Étape 3

``` text
Utilisateur
    │
    ▼
CloudFront
    │
    ▼
Bucket S3 privé
```

La nouvelle architecture est plus proche d'une configuration de
production :

-   le bucket n'est pas public ;
-   CloudFront sert les fichiers ;
-   les échanges utilisent HTTPS ;
-   le contenu peut être distribué mondialement ;
-   l'accès à S3 est limité par une policy précise.

------------------------------------------------------------------------

# Phrase de synthèse

> J'ai buildé mon application React en fichiers statiques, puis je l'ai
> déployée dans un bucket S3 privé servi publiquement en HTTPS par
> CloudFront grâce à une Origin Access Control.

------------------------------------------------------------------------

# JOURNAL.md --- Jour 6 : GitHub, CI/CD et authentification OIDC

## Objectif de la session

Automatiser complètement le déploiement du front TrialTrace.

Jusqu'ici, la mise en ligne nécessitait deux commandes manuelles :

``` powershell
npm run build
aws s3 sync dist/ s3://trialtrace-web-a6705ek23 --delete
```

L'objectif de cette étape était de remplacer ce déploiement manuel par
un pipeline GitHub Actions déclenché automatiquement à chaque `git push`
sur la branche `main`.

Le pipeline devait :

1.  récupérer le code ;
2.  installer Node.js ;
3.  installer les dépendances ;
4.  builder l'application React ;
5.  s'authentifier auprès d'AWS ;
6.  envoyer le contenu de `dist` dans S3 ;
7.  invalider le cache CloudFront.

------------------------------------------------------------------------

# 1. Mise en ligne du dépôt GitHub

Le projet local a été relié au dépôt :

``` text
https://github.com/Aka2/trialtrace
```

Commande utilisée :

``` powershell
git push -u origin main
```

## Erreur rencontrée

``` text
remote: Invalid username or token.
Password authentication is not supported for Git operations.
fatal: Authentication failed
```

GitHub n'accepte plus l'utilisation du mot de passe du compte pour les
opérations Git en HTTPS.

Une authentification adaptée était donc nécessaire.

------------------------------------------------------------------------

# 2. Authentification GitHub sous Windows

Une difficulté est apparue à cause des identifiants GitHub mémorisés par
Windows.

Même après la création d'un nouveau token, Git continuait à réutiliser
un ancien identifiant enregistré localement.

## Solution appliquée

Les identifiants GitHub mémorisés ont été supprimés depuis :

``` text
Gestionnaire d'identification Windows
→ Informations d'identification Windows
→ entrée git:https://github.com
→ Supprimer
```

Un nouveau Personal Access Token disposant des autorisations nécessaires
a ensuite été utilisé.

## Bonne pratique de sécurité

Il ne faut jamais :

-   publier un token ;
-   l'ajouter dans le dépôt ;
-   le placer dans un fichier versionné ;
-   le montrer dans une capture d'écran ;
-   le conserver en clair dans une commande partagée.

Une fois un token exposé, il doit être révoqué immédiatement puis
remplacé.

------------------------------------------------------------------------

# 3. Vérification du dépôt

Après le premier push réussi, les éléments suivants ont été vérifiés sur
GitHub :

``` text
web/
infra/
.github/
JOURNAL.md
```

Les éléments sensibles ou générés ne devaient pas apparaître :

``` text
node_modules/
dist/
.terraform/
*.tfstate
*.tfstate.*
```

Cette vérification confirme que le `.gitignore` protège correctement le
projet.

------------------------------------------------------------------------

# 4. Pourquoi ne pas stocker de clés AWS dans GitHub

GitHub Actions doit accéder au compte AWS pour déployer le front.

La mauvaise approche aurait été de créer une clé AWS permanente et de la
stocker dans les secrets GitHub.

Cela introduit un risque important :

-   la clé reste valide tant qu'elle n'est pas révoquée ;
-   elle peut fuiter dans un log ou une mauvaise configuration ;
-   elle constitue un secret durable à protéger.

La solution retenue est l'authentification OIDC.

------------------------------------------------------------------------

# 5. Comprendre OIDC

OIDC signifie :

``` text
OpenID Connect
```

L'idée principale est la suivante :

``` text
GitHub Actions
      │
      │ demande un jeton temporaire
      ▼
GitHub OIDC Provider
      │
      │ présente ce jeton à AWS
      ▼
AWS STS
      │
      │ vérifie l'identité et les conditions
      ▼
Rôle IAM temporairement assumé
```

Aucune clé AWS permanente n'est stockée dans GitHub.

Le jeton :

-   est généré pour une exécution précise ;
-   est valable pendant une courte durée ;
-   contient des informations sur le dépôt et la branche ;
-   expire automatiquement.

Phrase à retenir :

> OIDC replaces a long-lived stored secret with a short-lived token
> issued for each workflow run.

------------------------------------------------------------------------

# 6. Création du fournisseur OIDC GitHub dans AWS

Un nouveau fichier Terraform a été créé :

``` text
infra/github-oidc.tf
```

Le premier bloc déclare GitHub comme fournisseur d'identité approuvé :

``` hcl
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}
```

Ce bloc établit le pont de confiance entre AWS et le système d'identité
de GitHub Actions.

------------------------------------------------------------------------

# 7. Création du rôle IAM de déploiement

Un rôle IAM a été créé pour GitHub Actions :

``` hcl
resource "aws_iam_role" "github_deploy" {
  name = "trialtrace-github-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }

      Action = "sts:AssumeRoleWithWebIdentity"

      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }

        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:Aka2/trialtrace:ref:refs/heads/main"
        }
      }
    }]
  })
}
```

## Signification des conditions

La condition `aud` vérifie que le jeton est destiné à AWS STS.

La condition `sub` limite l'utilisation du rôle :

-   au dépôt TrialTrace ;
-   au propriétaire du dépôt ;
-   à la branche `main`.

Cela évite qu'un autre dépôt GitHub puisse utiliser ce rôle.

------------------------------------------------------------------------

# 8. Permissions du rôle GitHub Actions

Le rôle ne reçoit que les permissions nécessaires au déploiement du
front.

``` hcl
resource "aws_iam_role_policy" "github_deploy" {
  name = "trialtrace-deploy-policy"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]

        Resource = [
          aws_s3_bucket.frontend.arn,
          "${aws_s3_bucket.frontend.arn}/*"
        ]
      },
      {
        Effect = "Allow"

        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:ListDistributions"
        ]

        Resource = "*"
      }
    ]
  })
}
```

## Principe du moindre privilège

GitHub Actions peut :

-   lister le bucket du front ;
-   ajouter ou remplacer les fichiers du site ;
-   supprimer les fichiers obsolètes ;
-   rechercher la distribution CloudFront ;
-   créer une invalidation du cache.

Il ne peut pas administrer les autres services AWS.

------------------------------------------------------------------------

# 9. Output Terraform du rôle

L'ARN du rôle a été exposé avec :

``` hcl
output "github_role_arn" {
  value = aws_iam_role.github_deploy.arn
}
```

Après :

``` powershell
terraform apply
```

Terraform a affiché une valeur semblable à :

``` text
arn:aws:iam::123456789012:role/trialtrace-github-deploy
```

Cet ARN identifie le rôle que GitHub Actions doit endosser.

------------------------------------------------------------------------

# 10. Ajout du secret GitHub

Dans les paramètres du dépôt GitHub :

``` text
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Secret créé :

``` text
Name  : AWS_DEPLOY_ROLE_ARN
Value : ARN du rôle IAM GitHub Actions
```

Ce secret n'est pas une clé AWS.

Il contient uniquement l'identifiant du rôle que le workflow doit
demander à AWS.

------------------------------------------------------------------------

# 11. Création du workflow GitHub Actions

Le fichier suivant a été créé :

``` text
.github/workflows/deploy.yml
```

Version finale du workflow :

``` yaml
name: Deploy front to AWS

on:
  push:
    branches:
      - main

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Build
        working-directory: web
        run: |
          npm ci
          npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: eu-west-1

      - name: Deploy to S3
        run: |
          aws s3 sync web/dist/ s3://trialtrace-web-a6705ek23 --delete

      - name: Invalidate CloudFront
        run: |
          DIST_ID=$(aws cloudfront list-distributions             --query "DistributionList.Items[?Origins.Items[?contains(DomainName, 'trialtrace-web-a6705ek23')]].Id"             --output text)

          aws cloudfront create-invalidation             --distribution-id "$DIST_ID"             --paths "/*"
```

------------------------------------------------------------------------

# 12. Rôle de chaque étape du workflow

## Déclenchement

``` yaml
on:
  push:
    branches:
      - main
```

Le pipeline se déclenche automatiquement après chaque push sur `main`.

## Permissions OIDC

``` yaml
permissions:
  id-token: write
  contents: read
```

-   `id-token: write` permet au workflow de demander un jeton OIDC ;
-   `contents: read` permet de lire le contenu du dépôt.

## Checkout

``` yaml
uses: actions/checkout@v4
```

Télécharge le code du dépôt sur la machine temporaire GitHub Actions.

## Setup Node

``` yaml
uses: actions/setup-node@v4
```

Installe Node.js dans l'environnement du workflow.

## Build

``` yaml
npm ci
npm run build
```

-   `npm ci` installe exactement les versions du fichier lock ;
-   `npm run build` génère le dossier `web/dist`.

## Authentification AWS

``` yaml
uses: aws-actions/configure-aws-credentials@v4
```

Cette étape :

-   récupère un jeton OIDC GitHub ;
-   le présente à AWS ;
-   demande à assumer le rôle IAM ;
-   reçoit des identifiants AWS temporaires.

## Déploiement S3

``` yaml
aws s3 sync web/dist/ s3://... --delete
```

Synchronise le build React avec le bucket privé du front.

## Invalidation CloudFront

``` yaml
aws cloudfront create-invalidation
```

Force CloudFront à retirer l'ancienne version du cache afin que le
nouveau front soit visible rapidement.

------------------------------------------------------------------------

# 13. Activation de GitHub Actions

GitHub Actions n'était pas encore activé sur le dépôt.

Message observé :

``` text
Workflows aren't being run on this repository
```

Solution :

``` text
Onglet Actions
→ Enable Actions on this repository
```

Un nouveau commit a ensuite été poussé pour déclencher le workflow.

------------------------------------------------------------------------

# 14. Première erreur OIDC

Le workflow a échoué pendant l'étape :

``` text
Configure AWS credentials
```

Erreur :

``` text
Could not assume role with OIDC:
Not authorized to perform sts:AssumeRoleWithWebIdentity
```

Cette erreur signifie qu'AWS a reçu le jeton GitHub, mais que les
conditions de confiance du rôle ne correspondaient pas aux informations
contenues dans ce jeton.

------------------------------------------------------------------------

# 15. Méthode de débogage OIDC

Plusieurs éléments ont été vérifiés :

-   le fournisseur OIDC ;
-   l'ARN du rôle stocké dans GitHub ;
-   la permission `id-token: write` ;
-   la branche `main` ;
-   le nom du dépôt ;
-   la trust policy IAM ;
-   les permissions STS ;
-   les valeurs réelles du jeton.

Une étape temporaire d'inspection a permis de lire les claims du jeton
OIDC.

Le claim `sub` observé ne correspondait pas exactement au motif
initialement prévu.

Il contenait des identifiants internes associés au propriétaire et au
dépôt.

Le verrou `StringLike` a donc été ajusté pour correspondre à la valeur
réellement émise par GitHub tout en restant limité au dépôt et à la
branche attendus.

## Leçon retenue

Lorsqu'une authentification fédérée échoue, il ne faut pas seulement
relire la configuration théorique.

Il faut comparer :

``` text
valeurs attendues par AWS
VS
valeurs réellement contenues dans le jeton
```

------------------------------------------------------------------------

# 16. Ajustement des permissions CloudFront

Une permission supplémentaire a été nécessaire :

``` text
cloudfront:ListDistributions
```

Le workflow recherche l'identifiant de la distribution avec :

``` bash
aws cloudfront list-distributions
```

Le rôle devait donc pouvoir exécuter cette commande avant de créer
l'invalidation.

Cet ajout reste compatible avec le principe du moindre privilège : la
permission sert uniquement à identifier la distribution utilisée pour le
déploiement.

------------------------------------------------------------------------

# 17. Nettoyage du workflow

Une étape temporaire avait été ajoutée pour inspecter les claims OIDC.

Une fois le problème résolu, elle a été retirée afin de conserver un
pipeline propre.

Commit effectué :

``` powershell
git add .
git commit -m "Remove debug step, clean workflow"
git push
```

Le workflow final ne contient plus d'étape de diagnostic inutile.

------------------------------------------------------------------------

# 18. Résultat final

Le pipeline GitHub Actions est passé au vert.

Il exécute maintenant automatiquement :

``` text
git push
    │
    ▼
GitHub Actions
    │
    ├── Checkout
    ├── Setup Node
    ├── npm ci
    ├── npm run build
    ├── OIDC vers AWS
    ├── aws s3 sync
    └── CloudFront invalidation
    ▼
Site TrialTrace mis à jour
```

Aucune clé AWS permanente n'est stockée dans GitHub.

Le déploiement est désormais :

-   automatique ;
-   reproductible ;
-   sécurisé ;
-   traçable ;
-   déclenché par le versionnement du code.

------------------------------------------------------------------------

# 19. Synthèse de l'étape 4

## Ce que j'ai construit

Un pipeline CI/CD complet avec GitHub Actions.

À chaque push sur `main`, le pipeline :

-   construit le front React ;
-   s'authentifie auprès d'AWS avec OIDC ;
-   déploie les fichiers dans S3 ;
-   rafraîchit CloudFront.

## Concept clé

OIDC remplace une clé AWS permanente par une identité fédérée et un
jeton temporaire.

## Gros débogage réalisé

Erreur rencontrée :

``` text
Not authorized to perform sts:AssumeRoleWithWebIdentity
```

Diagnostic :

-   la configuration semblait correcte ;
-   le claim `sub` réel du jeton ne correspondait pas au verrou IAM ;
-   le motif de la trust policy a été corrigé ;
-   la permission `cloudfront:ListDistributions` a été ajoutée ;
-   l'étape de debug a ensuite été supprimée.

## Résultat

``` text
Workflow GitHub Actions : vert
Déploiement automatique : fonctionnel
Authentification permanente stockée : aucune
```

------------------------------------------------------------------------

# 20. Réponse d'entretien

> I built a GitHub Actions CI/CD pipeline that deploys a React
> application to a private S3 bucket behind CloudFront. The workflow
> authenticates to AWS through OIDC federation, so no long-lived AWS
> credentials are stored in GitHub. IAM permissions are restricted to
> the deployment bucket and the required CloudFront actions.

------------------------------------------------------------------------

# 21. Avancement global

``` text
✅ Étape 1 — AWS à la main
✅ Étape 2 — Terraform
✅ Étape 3 — React sur S3 + CloudFront
✅ Étape 4 — GitHub Actions + OIDC
➡️ Étape 5 — IAM en profondeur
➡️ Étape 6 — DynamoDB
```

Compétences désormais démontrées :

-   AWS ;
-   Terraform ;
-   React ;
-   TypeScript ;
-   GitHub Actions ;
-   CI/CD ;
-   IAM ;
-   OIDC ;
-   S3 ;
-   CloudFront ;
-   Lambda ;
-   API Gateway.

------------------------------------------------------------------------

# 22. Présentation possible sur le CV

## TrialTrace --- Cloud-native clinical data platform

**Technologies :**

``` text
AWS · Terraform · React · TypeScript · GitHub Actions
```

**Réalisations :**

-   Built and deployed a serverless web application on AWS with the
    entire infrastructure managed as code using Terraform.
-   Implemented a GitHub Actions CI/CD pipeline authenticated through
    AWS OIDC federation, without long-lived cloud credentials.
-   Applied least-privilege IAM permissions and deployed a private S3
    frontend behind CloudFront with HTTPS.

------------------------------------------------------------------------

# 23. Coûts à ce stade

Les ressources suivantes ont un coût très faible lorsqu'elles sont peu
utilisées :

-   S3 ;
-   CloudFront ;
-   Lambda ;
-   API Gateway.

Elles peuvent rester en place pendant la phase d'apprentissage, tout en
continuant à surveiller le budget AWS.

Le réflexe `terraform destroy` deviendra particulièrement important pour
les services plus coûteux utilisés dans les étapes futures.

------------------------------------------------------------------------

# Phrase de synthèse

> J'ai automatisé le déploiement de TrialTrace avec GitHub Actions :
> chaque push sur `main` construit l'application, obtient un accès AWS
> temporaire par OIDC, déploie le front dans S3 et invalide CloudFront,
> sans stocker aucune clé AWS permanente.

------------------------------------------------------------------------

# SESSION 8 --- Étape 6 : DynamoDB et dashboard alimenté par les données

## Objectif de l'étape

Ajouter une vraie couche de données à TrialTrace et faire en sorte que
le dashboard React n'affiche plus seulement une interface statique, mais
des statistiques calculées à partir de données stockées dans DynamoDB.

Cette étape introduit surtout une nouvelle manière de penser la
modélisation des données : contrairement à une base relationnelle comme
Oracle, DynamoDB est conçu à partir des questions que l'application doit
poser.

------------------------------------------------------------------------

## 1. S3 et DynamoDB : deux rôles différents

Dans TrialTrace, S3 et DynamoDB sont complémentaires.

**S3** stocke des fichiers entiers. Par exemple :

-   les fichiers du front React (`HTML`, `CSS`, `JavaScript`) ;
-   à terme, les documents ou rapports cliniques bruts.

**DynamoDB** stocke des données structurées que l'application doit
pouvoir lire et interroger précisément. Par exemple :

-   un participant ;
-   ses visites ;
-   ses valeurs cliniques ;
-   les anomalies détectées ;
-   leur niveau de gravité.

Exemple métier :

``` text
PDF brut d'un rapport clinique        → S3
Données extraites du rapport          → DynamoDB
```

À retenir :

> S3 est un stockage d'objets/fichiers ; DynamoDB est une base de
> données NoSQL destinée aux données structurées et aux accès
> applicatifs rapides.

------------------------------------------------------------------------

## 2. Comprendre PK et SK

Pour comprendre DynamoDB, j'utilise l'image d'une armoire à tiroirs.

La **Partition Key (PK)** correspond à l'étiquette du tiroir.

La **Sort Key (SK)** permet de distinguer et d'ordonner les fiches
présentes dans ce tiroir.

Exemple :

``` text
PK = SUBJECT#SITE01-0042

SK = PROFILE
SK = VISIT#2026-03-14
SK = VISIT#2026-04-11
SK = VISIT#2026-05-09
```

On peut le visualiser ainsi :

``` text
SUBJECT#SITE01-0042
│
├── PROFILE
├── VISIT#2026-03-14
├── VISIT#2026-04-11
└── VISIT#2026-05-09
```

Toutes les informations liées au même participant peuvent ainsi être
regroupées sous la même partition.

### Concept clé

Avec DynamoDB, le modèle de données doit être pensé à partir des
**access patterns**, c'est-à-dire des questions auxquelles l'application
devra répondre.

> En DynamoDB, on modélise à partir des questions, pas simplement à
> partir des entités.

------------------------------------------------------------------------

## 3. Différence avec une base relationnelle

Dans une base SQL comme Oracle, on pourrait avoir par exemple :

``` text
PARTICIPANTS
VISITES
```

avec une clé étrangère entre les deux tables, puis utiliser un `JOIN`
pour reconstruire les informations.

DynamoDB ne fonctionne pas de cette manière : il n'y a pas de `JOIN`
relationnel à effectuer à la volée.

Les données sont donc organisées dès leur écriture afin de rendre les
lectures importantes efficaces.

Cela oblige à connaître les principaux besoins de lecture avant de
choisir les clés.

------------------------------------------------------------------------

## 4. Données synthétiques

Pour développer TrialTrace sans utiliser de données patients réelles, un
jeu de données synthétiques a été généré.

Le jeu de test contient environ :

``` text
30 participants
~90 visites
```

Des anomalies ont volontairement été injectées afin de pouvoir tester la
logique métier du dashboard.

Le jeu de référence utilisé pendant cette étape contient :

``` text
90 rapports/visites analysés
76 conformes
10 déviations mineures
4 écarts critiques
14 écarts au total
```

Vérification :

``` text
76 + 10 + 4 = 90
10 + 4 = 14 anomalies
```

Ces données synthétiques permettent de tester l'application sans
manipuler de données cliniques réelles.

------------------------------------------------------------------------

## 5. Query vs Scan

Deux opérations DynamoDB importantes ont été distinguées.

### Query

Une `Query` cherche des éléments à partir d'une clé connue.

Elle est ciblée et généralement efficace.

Exemple :

``` text
Récupérer toutes les visites de SUBJECT#SITE01-0042
```

### Scan

Un `Scan` parcourt les éléments de la table.

Il est simple pour un petit jeu de données, mais devient plus coûteux
lorsque la table grossit.

Dans TrialTrace, la Lambda de statistiques utilise actuellement un
`Scan` afin de parcourir le jeu de données et calculer les indicateurs
globaux du dashboard.

### À retenir

> Query = accès ciblé à partir du modèle de clés.\
> Scan = parcours global de la table, acceptable ici pour
> l'apprentissage et le petit dataset, mais à surveiller à grande
> échelle.

------------------------------------------------------------------------

## 6. Lambda `get-stats`

Une Lambda dédiée calcule les statistiques utilisées par le dashboard.

Son rôle est de :

1.  lire les enregistrements DynamoDB ;
2.  parcourir les visites ;
3.  appliquer la logique de classification ;
4.  compter les éléments conformes, mineurs et critiques ;
5.  retourner les statistiques au front via l'API.

Le résultat obtenu est de la forme :

``` json
{
  "total": 90,
  "conformes": 76,
  "mineures": 10,
  "critiques": 4,
  "ecarts": 14
}
```

La classification permet donc au dashboard de ne pas afficher seulement
le nombre total de problèmes, mais également leur niveau de gravité.

------------------------------------------------------------------------

## 7. Valeur métier de la classification

Les 14 anomalies sont réparties ainsi :

``` text
10 déviations mineures
4 écarts critiques
```

Donc :

``` text
10 + 4 = 14
```

Cette distinction est importante pour TrialTrace.

Un utilisateur ne doit pas seulement savoir qu'il existe 14 problèmes :
il doit pouvoir identifier immédiatement les cas prioritaires.

Le code couleur du dashboard traduit cette hiérarchie :

``` text
Vert   → conforme
Ambre  → déviation mineure
Rouge  → écart critique
```

Ainsi, les 4 cas critiques peuvent être identifiés immédiatement comme
nécessitant une action prioritaire.

------------------------------------------------------------------------

## 8. Connexion du front React à l'API

Le dashboard React a été connecté à l'endpoint :

``` text
/stats
```

Le front utilise **TanStack Query** pour récupérer les données.

Principe :

``` text
DynamoDB
   │
   ▼
Lambda get-stats
   │
   ▼
API Gateway /stats
   │
   ▼
TanStack Query
   │
   ▼
React
   │
   ▼
Dashboard TrialTrace
```

Extrait du principe utilisé côté React :

``` tsx
const { data, isLoading, error } = useQuery<Stats>({
  queryKey: ['stats'],
  queryFn: async () => {
    const res = await fetch(`${API_URL}/stats`)
    if (!res.ok) throw new Error('Erreur réseau')
    return res.json()
  },
})
```

Le front ne contient donc pas les statistiques en dur : il les récupère
dynamiquement depuis le backend.

------------------------------------------------------------------------

## 9. Les quatre cartes du dashboard

Le dashboard affiche maintenant quatre indicateurs :

``` text
Rapports traités       : 90
Conformes              : 76
Déviations mineures    : 10
Écarts critiques       : 4
```

Le taux de conformité est calculé côté front :

``` text
76 / 90 ≈ 84 %
```

Les cartes utilisent le code couleur défini dans la direction artistique
:

-   teal pour le volume total ;
-   vert pour les données conformes ;
-   ambre pour les déviations mineures ;
-   rouge pour les écarts critiques.

Le dashboard est désormais alimenté par les données de l'application et
non par des valeurs statiques.

------------------------------------------------------------------------

## 10. Bug d'idempotence du seed

Le travail sur les données synthétiques a également permis d'identifier
un problème d'idempotence du mécanisme de seed.

Le jeu de référence, avec **14 anomalies connues**, a servi de point de
comparaison pour détecter que le résultat n'était pas celui attendu.

### Leçon

Un script de seed doit produire un état prévisible lorsqu'il est
relancé.

Le fait de disposer d'un jeu de référence connu permet de vérifier
rapidement si les données ont été dupliquées ou modifiées de manière
inattendue.

------------------------------------------------------------------------

## 11. Résultat de l'étape

L'epic **Données** est terminée.

TrialTrace dispose maintenant :

-   d'un jeu de données synthétiques ;
-   d'un stockage DynamoDB ;
-   d'une logique backend de classification ;
-   d'une Lambda de statistiques ;
-   d'un endpoint `/stats` ;
-   d'un front React connecté à l'API ;
-   de quatre indicateurs métier alimentés par les données.

Le dashboard est passé d'une maquette visuelle à une application qui lit
et interprète réellement des données.

------------------------------------------------------------------------

## 12. Synthèse de l'étape 6

> Epic Données terminée. Générateur de données synthétiques avec 30
> participants et environ 90 visites, anomalies injectées pour tester la
> logique métier. Les données sont stockées dans DynamoDB. Une Lambda
> `get-stats` parcourt les données et classe les visites en conformes,
> déviations mineures ou écarts critiques. L'endpoint `/stats` alimente
> quatre cartes React via TanStack Query. Cette étape m'a permis de
> comprendre la modélisation DynamoDB par access patterns, la différence
> entre `Query` et `Scan`, ainsi que l'importance de l'idempotence d'un
> script de seed.

------------------------------------------------------------------------

## 13. Réponse d'entretien : DynamoDB vs SQL

> In a relational database, I would normally model participants and
> visits in separate tables and join them when needed. With DynamoDB,
> there are no relational joins, so I design the keys around the
> application's access patterns. In TrialTrace, participant-related
> records can share the same partition key, while sort keys distinguish
> profiles and visits. This allows related data to be retrieved
> efficiently without performing joins.

------------------------------------------------------------------------

## 14. Réponse d'entretien : Query vs Scan

> A DynamoDB Query targets items using the table's key structure, while
> a Scan reads through the table. In TrialTrace, I currently use a Scan
> in the statistics Lambda because the synthetic dataset is small and I
> need global dashboard counts. For a larger production workload, I
> would avoid relying on full-table scans for frequent requests and
> design access patterns or indexes for the required queries.

------------------------------------------------------------------------

## 15. Avancement global

``` text
✅ Étape 1 — AWS à la main
✅ Étape 2 — Terraform
✅ Étape 3 — React + S3 + CloudFront
✅ Étape 4 — GitHub Actions + OIDC
✅ Étape 5 — IAM en profondeur
✅ Étape 6 — DynamoDB et epic Données
➡️ Étape 7 — Extraction par LLM
```

À ce stade, TrialTrace relie réellement :

``` text
Infrastructure
      +
Backend
      +
Base de données
      +
API
      +
Frontend
      +
CI/CD
```

------------------------------------------------------------------------

## Phrase de synthèse

> J'ai ajouté à TrialTrace une couche de données DynamoDB alimentée par
> un jeu synthétique, construit une Lambda qui calcule les statistiques
> métier et connecté le dashboard React à l'API `/stats`, ce qui
> transforme l'interface statique en dashboard réellement piloté par les
> données.

------------------------------------------------------------------------

# SESSION 9 --- Étape 7 : Ingestion & Extraction LLM

## Objectif

Faire évoluer TrialTrace vers une application capable de transformer un
contenu clinique non structuré en données JSON structurées et
contrôlées.

Flux conceptuel :

``` text
Texte clinique → Lambda d'extraction → LLM → JSON → validation du schéma → TrialTrace
```

Le LLM constitue la partie probabiliste du traitement ; la validation de
schéma sert de garde-fou déterministe avant que l'application consomme
le résultat.

## Lambda d'extraction LLM

Une Lambda orchestre le traitement : elle reçoit le contenu à analyser,
prépare l'appel au modèle, récupère la réponse structurée et la transmet
à la validation.

**Backlog :**

``` text
ID 22 — Lambda d'extraction : document vers JSON via LLM — DONE
```

## Validation de schéma

La réponse d'un LLM ne doit pas être utilisée aveuglément. Même
lorsqu'un JSON est demandé, le modèle peut retourner un champ manquant,
un mauvais type ou une structure inattendue.

La validation de schéma joue donc le rôle de contrat entre le LLM et
l'application :

``` text
Réponse LLM → validation → valide : suite du traitement
                        └→ invalide : rejet / erreur
```

> Le LLM propose une structure ; l'application vérifie qu'elle respecte
> son contrat avant de lui faire confiance.

**Backlog :**

``` text
ID 23 — Validation de schéma — DONE
```

## Écran d'import et suivi

Une interface React permet de lancer et suivre l'extraction. Dans la
version réalisée à cette étape, l'entrée repose sur du **texte collé**.
Le véritable upload d'un document vers S3 via URL présignée n'est donc
pas encore terminé.

**Backlog :**

``` text
ID 24 — Écran import + suivi de l'extraction — DONE
```

## État exact de l'epic « Ingestion & Extraction LLM »

L'epic rassemble les Work item IDs 21 à 25, mais seuls trois tickets ont
été validés pendant cette étape :

``` text
21 — Upload de document via URL présignée S3       TO DO
22 — Lambda d'extraction LLM                       DONE
23 — Validation de schéma                          DONE
24 — Écran import + suivi de l'extraction          DONE
25 — Gestion des échecs d'extraction               TO DO
```

Le ticket **21** reste ouvert parce que l'import actuel utilise du texte
collé et non un véritable upload de fichier via S3.

Le ticket **25** reste ouvert parce que la gestion complète des échecs
--- document illisible, contenu tronqué, extraction impossible, etc. ---
n'a pas encore été réalisée.

L'epic LLM n'est donc **pas encore entièrement fermé**, même si son cœur
fonctionnel est opérationnel.

## Comprendre la numérotation du backlog

Le `Work item ID` est un identifiant technique ; il ne correspond pas au
numéro de l'epic.

Pour déterminer l'epic auquel appartient un ticket, il faut regarder son
champ `Parent`.

> Règle : **Parent = rattachement fonctionnel ; Work item ID =
> identifiant technique.**

## Ce que cette étape démontre

L'objectif n'est pas simplement « d'appeler une IA ». L'architecture
sépare clairement :

``` text
LLM         = composant probabiliste
Validation  = garde-fou déterministe
Application = ne consomme qu'une structure conforme
```

Cette séparation permet d'intégrer un modèle génératif dans une
application de manière contrôlée.

## Synthèse de l'étape 7

> TrialTrace dispose maintenant d'une première chaîne d'extraction LLM
> capable de transformer un contenu clinique non structuré en JSON
> exploitable. Une Lambda orchestre l'appel au modèle, une validation de
> schéma protège l'application contre les sorties non conformes et un
> écran React permet de lancer et suivre l'extraction. Les tickets 22,
> 23 et 24 sont terminés ; les tickets 21 (upload réel via URL S3
> présignée) et 25 (gestion complète des échecs) restent ouverts.

## Réponse d'entretien

> In TrialTrace, I use an LLM to extract structured clinical information
> from unstructured text. The model output is not trusted directly: it
> goes through schema validation before the application can consume it.
> I also exposed the extraction flow through the React interface,
> creating a controlled boundary between the probabilistic LLM component
> and deterministic application logic.

## Avancement global

``` text
✅ Étape 1 — AWS à la main
✅ Étape 2 — Terraform
✅ Étape 3 — React + S3 + CloudFront
✅ Étape 4 — GitHub Actions + OIDC
✅ Étape 5 — IAM en profondeur
✅ Étape 6 — DynamoDB / Epic Données
✅ Étape 7 — Cœur de l'extraction LLM
   ├── 22 DONE
   ├── 23 DONE
   ├── 24 DONE
   ├── 21 TO DO
   └── 25 TO DO
➡️ Étape 8 — OpenSearch / Recherche
```

------------------------------------------------------------------------

# SESSION 10 --- Authentification Cognito et contrôle d'accès par rôle (RBAC)

## Objectif

Ajouter une authentification réelle à TrialTrace et différencier les
droits utilisateurs selon leur rôle.

``` text
Utilisateur non connecté
        │
        ▼
Connexion Cognito
        │
        ▼
JWT signé
        │
        ├── data-manager → accès complet
        └── auditor      → lecture seule
```

Cette étape introduit un contrôle d'accès par rôle dans l'interface et
prépare la future protection des API côté backend.

## 1. Authentification avec Amazon Cognito

TrialTrace utilise maintenant Amazon Cognito pour gérer
l'authentification des utilisateurs.

Le User Pool permet de gérer les comptes, les connexions, les sessions
et les groupes utilisateurs. Le front React utilise Amplify pour la
connexion et la persistance de session.

## 2. Deux rôles applicatifs

Deux groupes Cognito ont été définis.

### `data-manager`

Le gestionnaire de données peut notamment :

-   consulter les données ;
-   modifier le protocole ;
-   enregistrer les changements ;
-   émettre une query sur un écart.

### `auditor`

L'auditeur dispose d'un accès en lecture seule :

-   consultation des données ;
-   consultation du protocole ;
-   consultation des écarts ;
-   aucune modification du protocole ;
-   aucune émission de query.

## 3. Rôle porté par le JWT

Le rôle de l'utilisateur est transmis dans le claim Cognito :

``` text
cognito:groups
```

Le JWT est signé par Cognito. Son contenu peut être lisible, mais une
modification des claims invaliderait la signature.

À retenir :

> JWT signé ≠ JWT chiffré. La signature garantit l'intégrité et
> l'authenticité ; le chiffrement protège la confidentialité du contenu.

## 4. Adaptation de l'interface selon le rôle

### Page Protocole

Pour un `data-manager` :

``` text
Champs modifiables
Bouton Enregistrer visible
```

Pour un `auditor` :

``` text
Champs désactivés
Message « Lecture seule »
```

### Détail d'un écart

Pour un `data-manager` :

``` text
Bouton « Émettre une query »
```

Pour un `auditor` :

``` text
Pas d'action de modification
Message « Lecture seule »
```

Les deux comptes ont été testés et la distinction fonctionne
correctement.

## 5. Validation du RBAC

``` text
JWT Cognito
    │
    ▼
claim cognito:groups
    │
    ├── data-manager → interface interactive
    └── auditor      → interface en lecture seule
```

Résultat :

``` text
Authentification Cognito    ✅
Session persistante         ✅
Groupe utilisateur lu       ✅
data-manager                ✅ accès complet côté UI
auditor                     ✅ lecture seule côté UI
```

## 6. Point de sécurité fondamental : UI ≠ sécurité

Masquer des boutons dans React ne suffit pas à sécuriser une
application.

Un utilisateur peut contourner le front et appeler directement l'API
avec `curl`, Postman ou un script.

Phrase à retenir :

> UI-level access control is UX, not security. The backend must validate
> the JWT and enforce the authorization rules itself.

## 7. Prochaine couche : protéger les API

Architecture cible :

``` text
Utilisateur
    │ JWT Cognito
    ▼
API Gateway
    │ validation du token
    ▼
Lambda
    │ vérification du rôle
    ▼
Action autorisée ou refusée
```

Un utilisateur `auditor` devra recevoir un vrai refus serveur, par
exemple :

``` text
403 Forbidden
```

s'il tente une opération réservée au `data-manager`.

## 8. Futur : piste d'audit

Une fois l'identité vérifiée côté serveur, TrialTrace pourra tracer :

``` text
Qui ?
A fait quoi ?
Quand ?
Sur quelle donnée ?
```

Cette future piste d'audit renforcera la traçabilité et l'alignement
avec les principes ALCOA+.

## 9. Comptes de démonstration

Deux comptes de démonstration sont utilisés :

``` text
judith@trialtrace.demo  → groupe data-manager
auditor@trialtrace.demo → groupe auditor
```

Les mots de passe ne sont pas enregistrés dans ce journal versionné.
Même pour des comptes de démonstration, il vaut mieux garder les secrets
hors de Git.

## 10. Réponse d'entretien

> I implemented authentication with Amazon Cognito and role-based access
> control using Cognito groups. The user's role is carried in the signed
> JWT through the `cognito:groups` claim. A data manager gets the
> interactive features while an auditor receives a read-only experience.
> I also treat UI authorization only as UX: the next security layer
> enforces the JWT and role on the API itself.

## 11. Réflexe de fin de session

Sauvegarder le travail :

``` powershell
git add .
git commit -m "feat: add Cognito authentication and role-based access control"
git push
```

Si un domaine OpenSearch payant est recréé uniquement pour des tests, il
doit être détruit lorsqu'il n'est plus nécessaire afin de maîtriser les
coûts.

## 12. Synthèse

> Authentification Cognito et RBAC fonctionnels dans TrialTrace. Deux
> groupes sont utilisés : `data-manager` et `auditor`. Le rôle est lu
> dans le claim signé `cognito:groups` du JWT et l'interface React
> adapte les actions disponibles : accès complet pour le gestionnaire de
> données et lecture seule pour l'auditeur. Cette couche améliore
> l'expérience utilisateur, mais la sécurité réelle devra être renforcée
> côté API en validant le JWT et les permissions serveur avant chaque
> action sensible.

## Avancement sécurité

``` text
✅ Authentification Cognito
✅ Session utilisateur
✅ Groupes Cognito
✅ RBAC côté React
➡️ Protection JWT/RBAC côté API
➡️ Piste d'audit
```

------------------------------------------------------------------------

# COMPLÉMENT --- Correction et enrichissement de l'étape 7 : Bedrock et garde-fous LLM

La version précédente du journal résumait correctement le principe de
l'extraction LLM, mais omettait plusieurs détails techniques réellement
validés pendant la session.

## Modèle et service utilisés

L'extraction est exécutée dans AWS avec **Amazon Bedrock** et un modèle
**Claude Haiku 4.5 via un profil d'inférence EU**.

La Lambda utilise le client Bedrock Runtime et l'API `Converse`.

Le modèle transforme un compte-rendu clinique libre en structure JSON.
Un test a notamment confirmé sa capacité à normaliser :

``` text
« Visite du 5 mai 2026 » → "2026-05-05"
« 6,4 g/dL »             → 6.4
```

Cette capacité correspond au rôle attendu du LLM : comprendre une
formulation humaine et en extraire des données structurées.

## Garde-fou n°1 --- Nettoyage de la sortie

Même lorsqu'on demande uniquement du JSON, un modèle peut entourer sa
réponse de balises Markdown telles que :

``` text
```json
...
```


    La Lambda nettoie donc la sortie avant le `JSON.parse`.

    Si la réponse ne peut toujours pas être interprétée comme du JSON, elle est rejetée avec une erreur explicite au lieu d'être propagée.

    ## Garde-fou n°2 — Validation déterministe

    Une fois le JSON parsé, chaque champ est validé avant acceptation.

    Les contrôles mis en place comprennent notamment :

    ```text
    subjectId   → format SITE00-0000
    site        → chaîne non vide
    visitDate   → format AAAA-MM-JJ
    hemoglobin  → nombre compris entre 2 et 25
    dose        → nombre compris entre 0 et 1000

Une donnée qui ne respecte pas ces règles est rejetée avec un statut
HTTP :

``` text
422 Unprocessable Entity
```

## Test négatif réellement exécuté

Un compte-rendu contenant :

``` text
Hémoglobine à 950 g/dL
```

a volontairement été envoyé au pipeline.

Le LLM a correctement extrait :

``` json
{
  "hemoglobin": 950
}
```

mais la couche déterministe l'a rejeté avec :

``` text
statusCode = 422
hemoglobin invalide ou hors plage plausible (2-25)
```

Le résultat rejeté conserve également la valeur extraite et le motif de
rejet, ce qui rend le comportement explicable et facilite l'audit.

## Principe d'architecture

> Le LLM extrait ; il ne décide pas de la validité métier. Une couche
> déterministe valide avant propagation.

Dans un contexte clinique, une valeur incorrecte acceptée
silencieusement est plus dangereuse qu'une erreur explicite.

## Subtilité IAM / Bedrock rencontrée

L'utilisation d'un profil d'inférence Bedrock EU a nécessité d'ajuster
les permissions IAM associées à l'invocation du modèle.

Cette difficulté a renforcé le principe déjà appris avec IAM : une
intégration fonctionnelle nécessite des permissions précises sur les
ressources réellement invoquées.

## Pipeline validé de bout en bout

``` text
React — écran d'import
        │
        │ POST /extract
        ▼
API Gateway
        │
        ▼
Lambda d'extraction
        │
        ▼
Amazon Bedrock / Claude Haiku 4.5 EU
        │
        ▼
Nettoyage de la sortie
        │
        ▼
JSON.parse
        │
        ▼
Validation déterministe
        │
        ├── valide   → 200 + données
        └── invalide → 422 + motif + extraction
        │
        ▼
Affichage React
```

Deux scénarios ont été validés depuis le navigateur :

-   rapport valide → résultat vert ;
-   rapport avec hémoglobine à 950 g/dL → rejet rouge avec motif.

## Tickets validés à ce stade

La session source associe cette réalisation aux tickets :

``` text
TT-12 — Extraction par LLM       DONE
TT-13 — Validation de schéma     DONE
TT-14 — Écran d'import           DONE
```

L'upload réel de document via S3 reste distinct du flux de texte collé.

## Réponse d'entretien

> I built an LLM extraction pipeline on Amazon Bedrock that converts
> free-text clinical reports into structured JSON. I never trust the
> model output directly: I clean the response, parse it, then apply
> deterministic validation on formats, types and plausible ranges.
> Invalid values are rejected with an explicit 422 response rather than
> propagated. The LLM extracts; deterministic code decides whether the
> data is acceptable.

------------------------------------------------------------------------

# AUDIT DE COMPLÉTUDE DU JOURNAL

Une relecture croisée du journal et des notes de session montre que
certaines réalisations actuelles de TrialTrace ne sont pas encore
documentées avec le même niveau de détail que les étapes 1 à 7 et
Cognito/RBAC.

Les notes confirment que l'application possède désormais également :

``` text
- une recherche ;
- OpenSearch ;
- un moteur de règles ;
- un protocole configurable ;
- une navigation / sidebar enrichie ;
- une interrogation en langage naturel ;
- une interface bilingue / i18n ;
- Cognito + RBAC.
```

Cependant, les notes fournies ici ne contiennent pas assez de détails
techniques fiables pour reconstruire honnêtement les implémentations
OpenSearch, moteur de règles, interrogation en langage naturel et i18n
sans risquer d'inventer des commandes, fichiers ou choix d'architecture.

Ces sections sont donc marquées comme **à documenter depuis les sessions
sources**, plutôt que complétées avec des informations supposées.

## Section manquante à reconstituer --- OpenSearch

À documenter précisément depuis la session correspondante :

``` text
- provisioning Terraform du domaine ;
- authentification/signature SigV4 ;
- mapping ;
- indexation ;
- alias éventuels ;
- requêtes full-text ;
- différences constatées avec Elasticsearch auto-géré ;
- gestion du coût et destruction du domaine hors session.
```

Le parcours initial prévoyait explicitement OpenSearch comme moteur de
recherche full-text managé.

## Section manquante à reconstituer --- Moteur de conformité

À documenter depuis la session correspondante :

``` text
- représentation des règles du protocole ;
- règles déterministes ;
- classification des écarts ;
- jeu de test synthétique ;
- résultat du test de couverture des anomalies ;
- séparation stricte entre extraction LLM et décision de conformité.
```

Le principe architectural à préserver est :

> Toute décision de conformité doit être déterministe et reproductible ;
> le LLM ne prend pas la décision de conformité.

## Section manquante à reconstituer --- Protocole configurable

À documenter précisément :

``` text
- écran / structure de configuration ;
- règles modifiables ;
- persistance ;
- lien entre protocole et moteur de règles ;
- droits data-manager vs auditor.
```

## Section manquante à reconstituer --- Interrogation en langage naturel

À documenter depuis les sources de cette session :

``` text
- endpoint ;
- modèle utilisé ;
- mécanisme de function calling / tool calling ;
- transformation question → requête ;
- garde-fous ;
- requête affichée à l'utilisateur ;
- réponse expliquée.
```

## Section manquante à reconstituer --- i18n et navigation

À documenter :

``` text
- structure de la sidebar ;
- pages ajoutées ;
- mécanisme i18n ;
- langues réellement supportées ;
- comportement du sélecteur de langue ;
- couverture des textes de l'interface.
```

------------------------------------------------------------------------

# CORRECTION DE NOMMAGE DU JOURNAL

Les titres `Jour 1`, `Jour 2`, etc. ont été renommés en `Session 1`,
`Session 2`, etc. lorsqu'ils existaient dans le document.

Ce choix évite de laisser penser que les numéros correspondent à des
jours calendaires consécutifs : ils représentent des sessions de
travail.

------------------------------------------------------------------------

# ÉTAT DOCUMENTAIRE ACTUEL

## Bien documenté

``` text
✅ Contexte métier et problème TrialTrace
✅ AWS à la main
✅ Terraform et state distant
✅ Lambda / API Gateway
✅ React / S3 / CloudFront
✅ CI/CD GitHub Actions + OIDC
✅ IAM en profondeur
✅ DynamoDB
✅ Extraction LLM Bedrock + validation
✅ Écran d'import texte
✅ Cognito
✅ RBAC côté interface
```

## Fonctionnalités confirmées mais documentation technique à compléter

``` text
⚠️ OpenSearch
⚠️ Moteur de règles
⚠️ Protocole configurable
⚠️ Interrogation en langage naturel
⚠️ i18n / interface bilingue
⚠️ Navigation / sidebar complète
```

## Encore prévu / à renforcer

``` text
➡️ Autorisation JWT/RBAC côté API
➡️ Piste d'audit complète
➡️ Robustesse / retries / DLQ / idempotence selon la roadmap
➡️ Observabilité approfondie
```

Cette distinction est volontaire : le journal doit décrire ce qui est
réellement construit et vérifié, sans attribuer au projet des détails
techniques non présents dans les sources disponibles.
