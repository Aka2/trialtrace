# --- Le "user pool" : l'annuaire des utilisateurs ---
resource "aws_cognito_user_pool" "trialtrace" {
  name = "trialtrace-users"

  # Politique de mot de passe
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  # On se connecte avec l'email
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# --- Le "client" : l'application qui utilise ce pool ---
resource "aws_cognito_user_pool_client" "web" {
  name         = "trialtrace-web-client"
  user_pool_id = aws_cognito_user_pool.trialtrace.id

  # Pas de secret client (appli front, le secret ne peut pas être caché)
  generate_secret = false

  # Flux d'authentification autorisés
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
}

# --- Les deux groupes (rôles) ---
resource "aws_cognito_user_group" "data_manager" {
  name         = "data-manager"
  user_pool_id = aws_cognito_user_pool.trialtrace.id
  description  = "Gestionnaire de données : accès complet"
}

resource "aws_cognito_user_group" "auditor" {
  name         = "auditor"
  user_pool_id = aws_cognito_user_pool.trialtrace.id
  description  = "Auditeur : lecture seule + piste d'audit"
}

# --- Afficher les identifiants dont on aura besoin ---
output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.trialtrace.id
}
output "cognito_client_id" {
  value = aws_cognito_user_pool_client.web.id
}