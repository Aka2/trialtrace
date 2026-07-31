# JOURNAL.md -- Jour 1 : Découverte d'AWS

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

A Lambda is code that only exists while it's running. A server is always on and waiting; a Lambda spins up on a request, runs, and disappears — so I pay for execution, not for uptime, and I manage no infrastructure.

Nom : `trialtrace-hello`

Runtime : **Node.js 22.x**

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
-   Mise en place d'une Bucket rendu public pour l'exercice — à remplacer par CloudFront + bucket privé.
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
