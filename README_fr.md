# TrialTrace

🇬🇧 [Read in English](README.md) · 📓 [Journal de projet
détaillé](JOURNAL.md)

**Plateforme cloud-native de revue des données cliniques et de
conformité au protocole**

TrialTrace est un projet portfolio qui explore comment combiner cloud,
IA et règles déterministes pour faciliter la revue de données d'essais
cliniques. L'application centralise les données structurées, fait
ressortir les écarts selon leur gravité et démontre un pipeline
d'extraction IA contrôlé pour les comptes-rendus non structurés.

> **Politique de données :** toutes les données utilisées dans
> TrialTrace sont synthétiques. Aucune donnée patient réelle n'est
> utilisée.

## Aperçu du dashboard

![Dashboard TrialTrace](docs/dashboard.png)

## Le problème

La revue d'un essai clinique peut impliquer des informations réparties
entre plusieurs rapports, centres et systèmes. Cela complique la
détection rapide des écarts importants, leur priorisation et la
traçabilité des actions.

TrialTrace explore un workflow permettant de :

-   consulter les indicateurs principaux d'une étude ;
-   distinguer les données conformes, les déviations mineures et les
    écarts critiques ;
-   extraire des informations structurées depuis des comptes-rendus en
    texte libre ;
-   valider la sortie de l'IA avant son utilisation ;
-   rechercher et examiner les informations de l'étude ;
-   proposer des expériences différentes aux gestionnaires de données et
    aux auditeurs.

## Architecture

``` text
                         ┌──────────────────────┐
                         │   React / TypeScript │
                         └──────────┬───────────┘
                                    │
                           CloudFront / HTTPS
                                    │
                              S3 privé
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
    DynamoDB  Bedrock   OpenSearch
```

`*` OpenSearch et plusieurs fonctionnalités plus avancées sont déjà
présentes dans le projet, mais leurs sections détaillées du journal sont
encore en cours de reconstruction à partir des sessions de développement
originales.

L'infrastructure est gérée avec Terraform. Le déploiement du front est
automatisé avec GitHub Actions et l'authentification AWS OIDC.

## Fonctionnalités opérationnelles

-   Front React + TypeScript servi par CloudFront avec **bucket S3 privé
    et OAC**.
-   Infrastructure AWS gérée par Terraform avec **state distant S3
    chiffré et versionné**.
-   Backend API Gateway + Lambda.
-   Dashboard alimenté par DynamoDB et des données cliniques
    synthétiques.
-   Indicateurs conformes / déviations mineures / écarts critiques.
-   Pipeline Amazon Bedrock transformant un compte-rendu libre en JSON
    structuré.
-   Validation déterministe des sorties du LLM ; les valeurs invalides
    sont rejetées.
-   Authentification Cognito avec rôles `data-manager` et `auditor`.
-   Interface React adaptée au rôle.
-   CI/CD GitHub Actions authentifié auprès d'AWS par **OIDC, sans clé
    AWS de déploiement longue durée stockée dans GitHub**.

D'autres travaux déjà réalisés couvrent notamment OpenSearch/recherche,
le moteur de conformité déterministe, le protocole configurable,
l'interrogation en langage naturel et l'interface bilingue. Leur
documentation détaillée est en cours de consolidation dans le journal.

## Frontière de sécurité de l'IA

TrialTrace sépare volontairement l'extraction probabiliste de la
validation déterministe :

``` text
Texte clinique
     │
     ▼
Amazon Bedrock / LLM
     │ extrait
     ▼
JSON structuré
     │
     ▼
Validation déterministe
     │
     ├── valide   → accepté
     └── invalide → rejeté (422)
```

Lors d'un test, une hémoglobine impossible de `950 g/dL` a bien été
extraite par le modèle, puis rejetée par la validation applicative.

> **Le LLM extrait ; le code déterministe valide et applique les règles
> importantes.**

## Sécurité

Le projet applique plusieurs principes de sécurité :

-   compte root AWS protégé par MFA et non utilisé au quotidien ;
-   rôles IAM au moindre privilège ;
-   bucket S3 du front privé ;
-   Origin Access Control CloudFront ;
-   HTTPS via CloudFront ;
-   authentification GitHub Actions → AWS par fédération OIDC ;
-   Cognito et JWT pour l'authentification et les rôles ;
-   aucun mot de passe de démonstration dans la documentation
    versionnée.

Le RBAC actuel adapte l'interface selon le rôle. **La prochaine étape de
durcissement est l'application du JWT/RBAC côté API** : masquer un
bouton dans le front n'est pas considéré comme une frontière de
sécurité.

## CI/CD

Chaque push sur `main` déclenche :

``` text
git push
   │
   ▼
GitHub Actions
   ├── récupération du code
   ├── installation des dépendances
   ├── build React
   ├── identifiants AWS temporaires via OIDC
   ├── synchronisation vers S3
   └── invalidation CloudFront
```

La trust policy OIDC limite l'identité GitHub autorisée, et le rôle de
déploiement ne reçoit que les permissions AWS nécessaires.

## Données de démonstration

Le jeu de référence actuel contient environ :

  Indicateur              Valeur
  --------------------- --------
  Rapports / visites          90
  Conformes                   76
  Déviations mineures         10
  Écarts critiques             4
  Total des écarts            14

Les anomalies sont injectées volontairement afin de disposer d'un
résultat attendu pour tester l'application.

## Stack technique

  ---------------------------------------------------------------------
  Domaine                            Technologies
  ---------------------------------- ----------------------------------
  Frontend                           React, TypeScript, Vite, TanStack
                                     Query

  Cloud                              AWS Lambda, API Gateway, S3,
                                     CloudFront, DynamoDB, Cognito,
                                     Bedrock

  Recherche                          OpenSearch

  Infrastructure as Code             Terraform

  CI/CD                              GitHub Actions

  Authentification                   Cognito, JWT, OIDC

  Runtime                            Node.js

  Versionnement                      Git / GitHub
  ---------------------------------------------------------------------

## Structure du dépôt

``` text
trialtrace/
├── .github/
│   └── workflows/
├── infra/              # Terraform + infrastructure/code Lambda
├── web/                # Application React + TypeScript
├── README.md
├── README.fr.md
└── JOURNAL.md          # Journal détaillé du projet
```

## Développement local du front

Prérequis : Node.js et npm.

``` bash
cd web
npm install
npm run dev
```

Build de production :

``` bash
npm run build
```

## Workflow Terraform

Depuis `infra/` :

``` bash
terraform init
terraform plan
terraform apply
```

Ne pas lancer `terraform destroy` mécaniquement : le projet utilise un
backend S3 distant et certaines ressources, notamment OpenSearch,
nécessitent une gestion volontaire de leur cycle de vie et de leur coût.

## Apprentissages clés

-   Une infrastructure doit être reproductible et non dépendre de clics
    dans une console.
-   Un rôle IAM sépare **qui peut l'endosser** de **ce qu'il peut faire
    une fois endossé**.
-   DynamoDB se modélise à partir des access patterns plutôt qu'avec des
    jointures relationnelles.
-   OIDC évite les identifiants AWS longue durée dans le CI/CD.
-   Le RBAC côté interface améliore l'UX, mais l'autorisation réelle
    doit être appliquée côté serveur.
-   Une sortie LLM doit être considérée comme une entrée non fiable et
    validée de manière déterministe.

------------------------------------------------------------------------

## Commandes pratiques

### Développement React local

``` powershell
cd web
npm install
npm run dev
```

Build de production :

``` powershell
npm run build
```

Vite génère les fichiers déployables dans `web/dist/`.

### Vérifications AWS CLI

``` powershell
aws --version
aws sts get-caller-identity
```

`get-caller-identity` est un réflexe de sécurité important : la commande
permet de vérifier quelle identité AWS le terminal utilise réellement.

### Workflow Terraform

``` powershell
cd infra
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

Toujours lire `terraform plan` avant de confirmer un apply.

Après une modification :

``` powershell
terraform plan
```

Une infrastructure stable doit afficher `No changes`.

Outputs utiles :

``` powershell
terraform output
terraform output -raw site_url
terraform output -raw api_url
```

Le projet utilise un state Terraform distant dans S3. Les fichiers
`.tfstate` ne doivent jamais être commités et le bucket backend ne doit
pas être supprimé sans comprendre les conséquences.

### Modifications Lambda / API

Le packaging et le déploiement Lambda sont gérés par Terraform :

``` powershell
cd infra
terraform plan
terraform apply
terraform output -raw api_url
```

### Déploiement manuel du front

GitHub Actions assure normalement le déploiement, mais le workflow
manuel reste utile pour comprendre et déboguer :

``` powershell
cd web
npm run build
aws s3 sync dist/ s3://<frontend-bucket> --delete
```

Le bucket S3 reste privé ; CloudFront y accède via OAC.

Rafraîchir le cache CDN :

``` powershell
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

### Workflow Git

Avant de committer :

``` powershell
git status
git diff
```

Commit et push :

``` powershell
git add .
git commit -m "description du changement"
git push
```

Avant un push important :

``` powershell
git diff --cached
```

Protections `.gitignore` typiques :

``` gitignore
node_modules/
dist/
.terraform/
*.tfstate
*.tfstate.*
.env
.env.*
```

### GitHub Actions / CI-CD

Un push sur `main` déclenche le déploiement :

``` powershell
git push origin main
```

Pipeline :

``` text
checkout
→ npm ci
→ npm run build
→ identifiants AWS temporaires via OIDC
→ synchronisation S3
→ invalidation CloudFront
```

Le secret GitHub contient l'**ARN du rôle** de déploiement, pas des
Access Keys AWS :

``` text
AWS_DEPLOY_ROLE_ARN
```

Si OIDC échoue avec `sts:AssumeRoleWithWebIdentity`, vérifier :

1.  `permissions: id-token: write` ;
2.  l'ARN du rôle ;
3.  le fournisseur OIDC AWS ;
4.  les conditions de la trust policy ;
5.  les claims réellement présents dans le token GitHub ;
6.  les restrictions dépôt/branche.

À retenir :

``` text
Trust policy       → qui peut endosser le rôle ?
Permissions policy → que peut faire le rôle une fois endossé ?
```

### Vérification DynamoDB / dashboard

Après une modification backend :

``` powershell
terraform plan
terraform apply
```

Jeu synthétique de référence utilisé pendant le développement :

``` text
90 rapports/visites
76 conformes
10 déviations mineures
4 écarts critiques
14 écarts au total
```

Ces valeurs connues servent de test de non-régression.

### Vérification de l'extraction Bedrock

Requête conceptuelle :

``` json
{
  "text": "Compte-rendu clinique synthétique..."
}
```

Chemin valide :

``` text
POST /extract
→ Bedrock
→ nettoyage de la sortie
→ parsing JSON
→ validation déterministe
→ HTTP 200
```

Chemin invalide :

``` text
POST /extract
→ Bedrock
→ échec de validation déterministe
→ HTTP 422
```

Une valeur d'hémoglobine volontairement impossible sert de test négatif
pour prouver qu'une sortie LLM n'est jamais acceptée aveuglément.

### Vérification Cognito / RBAC

Tester les deux rôles :

``` text
data-manager → interface avec actions
auditor      → interface en lecture seule
```

Les mots de passe de démonstration ne doivent jamais être commités.

Le RBAC côté interface n'est pas la frontière de sécurité finale. Les
opérations protégées devront valider le JWT Cognito et le rôle côté
serveur.

### Gestion des coûts

Avant toute modification d'infrastructure :

``` powershell
terraform plan
```

OpenSearch est différent des premières ressources serverless : un
domaine provisionné peut générer un coût horaire.

Pour un diagnostic exceptionnel, inspecter d'abord un plan ciblé :

``` powershell
terraform plan -target="aws_opensearch_domain.trialtrace"
```

Les opérations Terraform ciblées ne doivent pas devenir le workflow
normal.

### Diagnostics utiles

``` powershell
git status
node --version
npm --version
aws --version
aws sts get-caller-identity
terraform version
terraform fmt -check
terraform validate
terraform plan
terraform output
```

## Checklist avant publication GitHub

Avant chaque push public, vérifier que le dépôt ne contient aucun :

-   AWS Access Key ID ;
-   AWS Secret Access Key ;
-   GitHub Personal Access Token ;
-   mot de passe Cognito/de démonstration ;
-   clé privée ;
-   fichier `.env` contenant des secrets ;
-   state Terraform ;
-   donnée patient ou clinique réelle.

Les URL API, noms de buckets et ARN ne sont pas des mots de passe, mais
la documentation utilise de préférence des placeholders lorsque leur
valeur exacte n'est pas nécessaire.

------------------------------------------------------------------------

## Documentation détaillée

Le détail des sessions, commandes, erreurs, décisions, tests et
apprentissages est disponible dans :

**[JOURNAL.md](JOURNAL.md)**

Version anglaise de présentation :

**[README.md](README.md)**

## État / prochaines étapes de durcissement

Priorités actuelles :

-   appliquer la validation JWT et le RBAC côté API ;
-   compléter la piste d'audit ;
-   consolider la documentation détaillée OpenSearch, moteur de
    conformité, langage naturel et i18n ;
-   poursuivre les travaux de robustesse et d'observabilité.

## Résumé portfolio

> Conception et déploiement d'une application cloud-native de revue de
> données cliniques sur AWS : infrastructure Terraform, front
> React/TypeScript, APIs serverless, DynamoDB, extraction Amazon Bedrock
> avec validation déterministe, Cognito/RBAC et pipeline GitHub Actions
> authentifié via OIDC.
