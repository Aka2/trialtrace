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
    DynamoDB  Bedrock   OpenSearch*
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

  -----------------------------------------------------------------------
  Domaine                             Technologies
  ----------------------------------- -----------------------------------
  Frontend                            React, TypeScript, Vite, TanStack
                                      Query

  Cloud                               AWS Lambda, API Gateway, S3,
                                      CloudFront, DynamoDB, Cognito,
                                      Bedrock

  Recherche                           OpenSearch

  Infrastructure as Code              Terraform

  CI/CD                               GitHub Actions

  Authentification                    Cognito, JWT, OIDC

  Runtime                             Node.js

  Versionnement                       Git / GitHub
  -----------------------------------------------------------------------

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
