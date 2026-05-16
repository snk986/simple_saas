export function mapAuthErrorToKey(error: { message?: string; code?: string }) {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    code.includes("invalid_credentials") ||
    message.includes("invalid login credentials")
  ) {
    return "authErrors.invalidCredentials";
  }

  if (
    code.includes("email_exists") ||
    message.includes("user already registered") ||
    message.includes("already registered")
  ) {
    return "authErrors.emailAlreadyRegistered";
  }

  if (code.includes("email_not_confirmed") || message.includes("email not confirmed")) {
    return "authErrors.emailNotConfirmed";
  }

  if (code.includes("over_request_rate_limit") || message.includes("rate limit")) {
    return "authErrors.rateLimited";
  }

  return "authErrors.generic";
}

export function mapOAuthErrorToKey(error: { message?: string; code?: string }) {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    message.includes("provider is not enabled") ||
    message.includes("unsupported provider") ||
    code.includes("provider_not_enabled")
  ) {
    return "authErrors.oauthProviderNotEnabled";
  }

  if (
    message.includes("invalid redirect") ||
    message.includes("redirect uri") ||
    message.includes("redirect_to") ||
    message.includes("bad oauth") ||
    code.includes("invalid_redirect_url") ||
    code.includes("bad_oauth_callback")
  ) {
    return "authErrors.oauthConfigInvalid";
  }

  return "authErrors.generic";
}
