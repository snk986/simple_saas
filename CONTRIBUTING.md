# Contributing to Calyra AI

Thanks for helping improve Calyra AI. This repository is maintained as a
self-hostable AI music generation platform and starter kit for developers who
want to build prompt-to-song, lyrics-to-song, public song pages, credits, and
creator workflows.

## Ways to contribute

- Fix bugs in the generation flow, auth, payments, storage, or i18n routes.
- Improve provider adapters in `lib/audio/` and `lib/ai/`.
- Add focused tests for API routes, provider contracts, and critical UI flows.
- Improve setup documentation for Supabase, AI providers, audio providers, and
  deployment targets.
- Triage issues, reproduce bugs, and help keep examples current.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Add your own Supabase, AI provider, audio provider, and optional payment keys.
4. Run `pnpm dev`.
5. Open `http://localhost:3000`.

## Development guidelines

- Keep changes narrowly scoped and aligned with the existing Next.js App Router
  structure.
- Use `utils/supabase/client.ts` in browser components and
  `utils/supabase/server.ts` in API routes or server components.
- Do not expose service-role keys or provider secrets to client components.
- Route audio generation through `lib/audio/index.ts` instead of importing a
  concrete provider directly.
- Keep user-facing strings in `messages/` unless a page is intentionally
  English-only.
- Run `pnpm build` before opening a pull request when possible.

## Pull requests

Please include:

- A clear summary of the change.
- Screenshots for user-facing UI changes.
- Notes about any environment variables, migrations, or provider behavior.
- The verification command you ran, usually `pnpm build`.

Small, focused pull requests are easier to review and merge.
