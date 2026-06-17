# Calyra AI

Open-source AI music generation platform built with Next.js, Supabase, and
pluggable AI/audio providers.

Calyra AI is a self-hostable starter for building products that turn prompts,
stories, and lyrics into generated songs. It includes the production pieces that
many AI music prototypes skip: authentication, credits, audio provider
abstraction, public song pages, creator dashboards, i18n, SEO pages, payments,
webhooks, and storage.

The hosted Calyra product can be commercial, but this repository is maintained
as an open-source application template for developers who want to study, fork,
self-host, or extend an AI music workflow with their own provider keys.

## What You Can Build

- Text-to-song and lyrics-to-song generation flows.
- AI lyrics generation and editable drafts.
- Audio generation with provider adapters.
- Public song pages with sharing, cover art, and SEO metadata.
- User dashboards for generated songs, credits, and subscriptions.
- Multilingual marketing pages with `next-intl`.
- Payment and credit flows for commercial deployments.
- Provider-backed webhooks and background finalization jobs.

## Tech Stack

- Next.js App Router and TypeScript.
- Supabase Postgres, Auth, Storage, and Row Level Security.
- Provider-based AI text generation in `lib/ai/`.
- Provider-based audio generation in `lib/audio/`.
- Creem.io payment integration.
- next-intl for English, Spanish, Portuguese, Japanese, and Korean routes.
- shadcn/ui, Tailwind CSS, and Framer Motion.
- pnpm for package management.

## Architecture

```text
app/[locale]/          localized public and product routes
app/api/               API routes, webhooks, cron jobs, generation endpoints
components/            shared UI, home, create, dashboard, song, pricing views
config/                static product, style, subscription, and SEO config
lib/ai/                AI provider contracts and prompt generation
lib/audio/             audio provider abstraction and finalization helpers
messages/              next-intl translation files
supabase/              database migrations and schema assets
utils/supabase/        browser, server, middleware, and service-role clients
types/                 shared TypeScript domain types
```

The most important extension point is the provider layer. UI and API routes
should call `lib/audio/index.ts` and `lib/ai/provider.ts` instead of importing a
single vendor directly. This keeps the application usable with different
generation services.

## Provider Model

Calyra AI is designed around bring-your-own-provider deployments.

| Area | Current support | Notes |
| --- | --- | --- |
| AI text and lyrics | GitHub Models, Claude-compatible provider path | Configure with environment variables. |
| Audio generation | fal.ai, kie.ai, wavespeed.ai adapters | Route through `lib/audio/index.ts`. |
| Database and auth | Supabase | Uses client, server, middleware, and service-role clients. |
| Storage | Supabase Storage | Generated audio and cover art can be stored in buckets. |
| Payments | Creem.io | Optional for self-hosted non-commercial demos. |
| Email | Resend | Optional depending on auth and notification flows. |

## Quick Start

### Prerequisites

- Node.js 20 or newer.
- pnpm 10 or newer.
- Supabase project.
- At least one AI text provider key.
- At least one audio generation provider key.

Payments, analytics, email, and cron are optional for local development.

### Install

```bash
git clone https://github.com/snk986/simple_saas.git calyra-ai
cd calyra-ai
pnpm install
cp .env.example .env.local
```

### Configure Environment

Edit `.env.local` and add your own keys.

Required for most local flows:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_MEDIA_BUCKET=songs

AI_PROVIDER=github
AUDIO_PROVIDER=fal

GITHUB_MODELS_API_KEY=
FAL_API_KEY=
BASE_URL=http://localhost:3000
```

Optional production integrations include Creem.io, Resend, Google Analytics,
kie.ai, wavespeed.ai, and provider webhook URLs. See `.env.example` for the
full list.

### Database

Create a Supabase project and run the migrations in `supabase/migrations`.

Recommended Supabase checks:

- Enable email auth or the auth providers you need.
- Create the configured media bucket.
- Review Row Level Security policies before production use.
- Keep the service-role key server-side only.

### Run Locally

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Verify

```bash
pnpm build
```

## Deployment

The app is designed for Vercel-style deployments, but it can run anywhere that
supports Next.js, Node.js, environment variables, and outbound provider calls.

For production:

- Set `BASE_URL` to your public site URL.
- Configure provider webhook URLs under `/api/webhooks/*`.
- Use production Supabase credentials and storage buckets.
- Configure Creem.io product IDs only if payments are enabled.
- Keep `SKIP_CREDIT_CHECK` disabled outside dev and preview environments.

## Commercial Use and Open Source Scope

This repository is MIT licensed. You can fork it, self-host it, modify it, and
use it as the base for commercial products, subject to the licenses and terms of
the third-party providers you configure.

The open-source scope includes the application code, provider contracts, UI,
API routes, docs, and setup patterns in this repository. Hosted service data,
private deployment secrets, third-party models, generated media, and commercial
provider accounts are not included.

## Contributing

Contributions are welcome. Good starting areas include:

- Provider adapters and contract tests.
- Supabase migration documentation.
- Generation flow reliability.
- i18n improvements.
- Security hardening for webhooks and private routes.
- Setup guides for self-hosted deployments.

Read `CONTRIBUTING.md` before opening a pull request.

## Roadmap

- Add contract tests for audio providers.
- Document a clean local Supabase seed flow.
- Improve webhook verification examples for each audio provider.
- Add more self-hosting deployment guides.
- Add provider comparison docs for cost, latency, webhook behavior, and output
  format.
- Improve accessibility and mobile layout coverage across public song pages and
  generation flows.

## Maintainer Notes

This project started as a fork of a SaaS starter and has been substantially
rebuilt into an AI music generation platform. The current maintainer focus is
to make the repository useful as open-source software: clear setup docs,
replaceable providers, public issue triage, security review, release notes, and
repeatable deployment guidance.

See `docs/OPEN_SOURCE_MAINTENANCE.md` for the open-source maintenance plan.

## License

MIT. See `LICENSE`.
