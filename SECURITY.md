# Security Policy

Calyra AI handles authentication, payments, user-generated prompts, generated
audio, storage URLs, and third-party provider webhooks. Please report security
issues responsibly.

## Supported versions

The `main` branch is the only actively maintained branch unless a release branch
is announced in `CHANGELOG.md`.

## Reporting a vulnerability

Please do not open a public issue for vulnerabilities.

Report security issues by emailing `support@calyraai.com` with:

- A description of the issue.
- Reproduction steps or proof of concept.
- Affected routes, files, or providers.
- Any known impact or suggested mitigation.

We aim to acknowledge valid reports within 72 hours.

## Security boundaries

- Supabase service-role keys must remain server-side.
- Credits and billing operations should use server-side routes and RPC helpers.
- Provider API keys for AI, audio generation, email, and payments must never be
  exposed to browser bundles.
- Public song pages may be indexed, but private reports and account data must
  require authentication.
- Webhooks should validate provider signatures or shared secrets where the
  provider supports them.
