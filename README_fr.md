# TrialTrace

🇬🇧 [Read in English](README.md)

**Plateforme cloud-native de revue des données cliniques et de conformité au protocole**

TrialTrace est un projet portfolio qui explore comment combiner cloud, IA et règles déterministes pour faciliter la revue de données d'essais cliniques. L'application centralise les données structurées, fait ressortir les écarts au protocole selon leur gravité, valide les données extraites par IA avant usage, et applique un contrôle d'accès par rôle avec une piste d'audit complète.

> **Politique de données :** toutes les données utilisées dans TrialTrace sont synthétiques. Aucune donnée patient réelle n'est utilisée.

## Aperçu du dashboard

![Dashboard TrialTrace](docs/Dashboard.png)

## Le problème

La revue d'un essai clinique peut impliquer des informations réparties entre plusieurs rapports, centres et systèmes. Cela complique la détection rapide des écarts importants, leur priorisation et la traçabilité, attribuable, des actions.

TrialTrace explore un workflow permettant de :

- consulter les indicateurs principaux d'une étude ;
- distinguer les données conformes, les déviations mineures et les écarts critiques ;
- extraire des informations structurées depuis des comptes-rendus en texte libre, avec validation déterministe ;
- rechercher des participants et consulter leur historique de visites complet ;
- configurer les règles du protocole et voir les écarts se recalculer en temps réel ;
- interroger les données de l'étude en langage naturel ;
- travailler en français ou en anglais ;
- appliquer des permissions différentes, contrôlées côté serveur, aux gestionnaires de données et aux auditeurs ;
- tracer chaque action sensible dans une piste d'audit.

## Architecture

``` text
                         ┌──────────────────────┐
                         │   React / TypeScript │
                         └──────────┬───────────┘
                                    │
                           CloudFront / HTTPS
                                    │
                              S3 privé (OAC)
                                    │
                                    ▼
                              API Gateway
                     (authorizer JWT Cognito)
                                    │
                 ┌──────────────────┴──────────────────┐
                 │                                      │
              Lambda                                Cognito
                 │                                Auth / RBAC
        ┌────────┼─────────┐
        │        │         │
    DynamoDB  Bedrock   OpenSearch
```

L'infrastructure est gérée avec Terraform. Le déploiement du front est automatisé avec GitHub Actions et l'authentification AWS par fédération OIDC.

## Fonctionnalités

- Front React + TypeScript servi par CloudFront avec **bucket S3 privé et OAC**.
- Infrastructure AWS gérée par Terraform avec **state distant S3 chiffré et versionné**.
- Backend serverless API Gateway + Lambda.
- Dashboard alimenté par DynamoDB et des données cliniques synthétiques.
- Indicateurs conformes / déviations mineures / écarts critiques.
- **Extraction Amazon Bedrock** transformant un compte-rendu libre en JSON structuré, avec **validation déterministe** — les valeurs invalides sont rejetées, pas propagées.
- **Recherche plein-texte OpenSearch** sur les participants (requêtes signées SigV4).
- **Moteur de conformité déterministe** validé contre un jeu de données synthétique connu (14 anomalies injectées détectées, 0 faux positif).
- **Protocole configurable** stocké dans DynamoDB — modifier une règle recalcule les écarts et les statistiques en temps réel.
- **Interrogation en langage naturel** via function calling : le modèle choisit parmi des opérations sûres, en lecture seule, exécutées par du code déterministe.
- **Interface bilingue (français / anglais)** avec bascule de langue en direct.
- **Authentification Cognito** avec rôles `data-manager` et `auditor`.
- **RBAC côté serveur** : l'API valide le JWT Cognito et le rôle ; les actions interdites renvoient `403` même si le front est contourné.
- **Déconnexion automatique** après inactivité.
- **Piste d'audit ALCOA+** : chaque modification de protocole et chaque query est enregistrée (qui / quoi / quand), en ajout seul, filtrable par action et par utilisateur.
- **Pagination du tableau des écarts** et **vue détail participant** avec historique des visites.
- CI/CD GitHub Actions authentifié auprès d'AWS par **OIDC — sans clé AWS de déploiement longue durée stockée dans GitHub**.

## Frontière de sécurité de l'IA

TrialTrace sépare volontairement l'extraction probabiliste de la validation déterministe :

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

Lors d'un test, une hémoglobine impossible de `950 g/dL` a bien été extraite par le modèle, puis rejetée par la validation applicative.

> **Le LLM extrait ; le code déterministe valide et applique les règles importantes.**

Le même principe s'applique à l'interrogation en langage naturel : le modèle ne fait que choisir quelle opération prédéfinie, en lecture seule, appeler — c'est le code déterministe qui l'exécute. Le modèle exprime une intention ; le code applique les limites.

## Sécurité

Le projet applique plusieurs principes de sécurité :

- compte root AWS protégé par MFA et non utilisé au quotidien ;
- rôles IAM au moindre privilège ;
- bucket S3 du front privé avec Origin Access Control CloudFront ;
- HTTPS via CloudFront ;
- authentification GitHub Actions → AWS par fédération OIDC (sans clé longue durée) ;
- authentification Cognito avec rôles portés par le JWT ;
- **autorisation côté serveur** : API Gateway valide nativement le JWT (signature, expiration, issuer, audience) et les Lambdas sensibles vérifient le rôle, renvoyant `403` pour les opérations interdites ;
- déconnexion automatique sur inactivité ;
- piste d'audit en ajout seul pour les actions sensibles ;
- aucun mot de passe de démonstration dans la documentation versionnée.

> Le contrôle d'accès au niveau de l'interface, c'est de l'UX, pas une frontière de sécurité. La vraie autorisation est appliquée côté serveur — masquer un bouton dans le front n'est jamais considéré comme une protection.

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

La trust policy OIDC limite l'identité GitHub autorisée, et le rôle de déploiement ne reçoit que les permissions AWS nécessaires.

## Jeu de données de référence

Le jeu de données synthétique contient, par construction :

| Indicateur          | Valeur |
| ------------------- | ------ |
| Rapports / visites  | 90     |
| Conformes           | 76     |
| Déviations mineures | 10     |
| Écarts critiques    | 4      |
| Total des écarts    | 14     |

Les anomalies sont injectées volontairement afin de disposer d'un résultat attendu connu pour tester l'application (un test de non-régression intégré).

## Stack technique

| Domaine                | Technologies                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| Frontend               | React, TypeScript, Vite, TanStack Query, react-i18next           |
| Cloud                  | AWS Lambda, API Gateway, S3, CloudFront, DynamoDB, Cognito, Bedrock |
| Recherche              | OpenSearch                                                       |
| Infrastructure as Code | Terraform                                                        |
| CI/CD                  | GitHub Actions                                                   |
| Authentification       | Cognito, JWT, OIDC                                               |
| Runtime                | Node.js                                                          |
| Versionnement          | Git / GitHub                                                     |

## Structure du dépôt

``` text
trialtrace/
├── .github/
│   └── workflows/
├── infra/              # Terraform + infrastructure/code Lambda
├── engine/             # Règles de conformité déterministes
├── scripts/            # Génération de données synthétiques
├── web/                # Application React + TypeScript
├── README.md
└── README_fr.md
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

Ne pas lancer `terraform destroy` mécaniquement : le projet utilise un backend S3 distant et certaines ressources, notamment les services payants comme OpenSearch, nécessitent une gestion volontaire de leur cycle de vie et de leur coût.

> **Note OpenSearch :** OpenSearch est un *index de recherche dérivé*, pas la source de vérité. Si le domaine est détruit pour maîtriser les coûts puis recréé, il revient vide — il faut relancer la Lambda d'indexation pour le repeupler depuis DynamoDB. Perdre l'index ne signifie jamais perdre les données.

## Apprentissages clés

- Une infrastructure doit être reproductible et non dépendre de clics dans une console.
- Un rôle IAM sépare **qui peut l'endosser** de **ce qu'il peut faire une fois endossé**.
- DynamoDB se modélise à partir des access patterns plutôt qu'avec des jointures relationnelles.
- OIDC évite les identifiants AWS longue durée dans le CI/CD.
- Le RBAC côté interface améliore l'UX, mais l'autorisation réelle doit être appliquée côté serveur.
- Une sortie LLM doit être considérée comme une entrée non fiable et validée de manière déterministe.
- L'access token porte l'autorisation (scopes, groupes) ; l'ID token porte l'identité (email). Utiliser le bon jeton selon l'usage.

## Checklist avant publication GitHub

Avant chaque push public, vérifier que le dépôt ne contient aucun : clé d'accès AWS, token GitHub, mot de passe Cognito/de démonstration, clé privée, fichier `.env` contenant des secrets, state Terraform, ou donnée patient/clinique réelle.

Les URL API, noms de buckets et ARN ne sont pas des mots de passe, mais des placeholders sont préférés dans la documentation lorsque leur valeur exacte n'est pas nécessaire.

## État / prochaines étapes

Le cœur de la plateforme est complet. Évolutions possibles :

- microservices / découpage événementiel (EventBridge / SQS) ;
- robustesse et observabilité (retries, files de lettres mortes, idempotence) ;
- enrichissements supplémentaires (upload de fichier réel, formatage des dates/nombres selon la langue).

## Résumé portfolio

> Conception et déploiement d'une application cloud-native de revue de données cliniques sur AWS : infrastructure Terraform, front React/TypeScript, APIs serverless, DynamoDB, extraction Amazon Bedrock avec validation déterministe, recherche OpenSearch, moteur de conformité validé, interrogation en langage naturel, interface bilingue, authentification Cognito avec RBAC appliqué côté serveur, piste d'audit ALCOA+, et CI/CD GitHub Actions authentifié par fédération OIDC.
