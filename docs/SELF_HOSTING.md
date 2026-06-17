# Self-Hosting Guide

This guide describes the minimum path for running Calyra AI with your own
infrastructure and provider keys.

## 1. Create Provider Accounts

Required:

- Supabase for database, auth, and storage.
- One AI text provider supported by `lib/ai/`.
- One audio generation provider supported by `lib/audio/`.

Optional:

- Creem.io for payments.
- Resend for email.
- Google Analytics for analytics.

## 2. Configure Supabase

1. Create a Supabase project.
2. Run the SQL migrations under `supabase/migrations`.
3. Create the media bucket configured by `SUPABASE_MEDIA_BUCKET`.
4. Enable the auth providers you want to support.
5. Copy the project URL, publishable key, and service-role key into
   `.env.local`.

Keep the service-role key server-side only.

## 3. Configure Generation Providers

Set the provider selectors:

```bash
AI_PROVIDER=github
AUDIO_PROVIDER=fal
```

Then add keys for the selected providers. For example:

```bash
GITHUB_MODELS_API_KEY=
FAL_API_KEY=
FAL_WEBHOOK_URL=https://your-domain.com/api/webhooks/fal
```

Use `.env.example` as the source of truth for supported environment variables.

## 4. Run Locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

For local development you can set:

```bash
BASE_URL=http://localhost:3000
SKIP_CREDIT_CHECK=true
```

Do not enable `SKIP_CREDIT_CHECK` in production.

## 5. Deploy

Deploy the Next.js app to your preferred platform and configure all production
environment variables there.

Production checklist:

- `BASE_URL` points to the public domain.
- Webhook URLs point to the deployed `/api/webhooks/*` routes.
- Payment success URLs point to the deployed product route.
- Supabase auth callback URLs include your production domain.
- Cron secrets and webhook secrets are unique per environment.
- Provider keys are not exposed to client bundles.

## 6. Verify

Run:

```bash
pnpm build
```

Then manually verify:

- Sign up and sign in.
- Generate lyrics or a song draft.
- Generate audio with the selected audio provider.
- Confirm generated media is stored and playable.
- Open a public song page.
- Confirm private dashboard pages require authentication.
