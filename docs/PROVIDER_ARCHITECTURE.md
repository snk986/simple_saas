# Provider Architecture

Calyra AI keeps provider-specific code behind small contracts so developers can
replace vendors without rewriting product routes.

## AI Text Providers

AI text generation lives under `lib/ai/`.

Responsibilities:

- Generate lyrics, prompts, and creator-facing reports.
- Normalize provider responses into application types.
- Keep provider API keys server-side.
- Retry external API failures once where supported by route behavior.

Entry points:

- `lib/ai/provider.ts`
- `lib/ai/prompts.ts`
- `lib/ai/types.ts`

## Audio Providers

Audio generation lives under `lib/audio/`.

Responsibilities:

- Submit generation jobs.
- Poll or receive webhook status.
- Normalize generated audio URLs and metadata.
- Finalize generated media into storage.

Entry points:

- `lib/audio/index.ts`
- `lib/audio/types.ts`
- `lib/audio/finalize-generation.ts`

Application code should call `lib/audio/index.ts` instead of importing concrete
provider files directly.

## Adding a Provider

1. Add environment variables to `.env.example`.
2. Implement the provider contract in the appropriate provider folder.
3. Add selection logic to the provider index.
4. Document callback, polling, storage, and error behavior.
5. Add fixtures or tests where possible.
6. Update `docs/SELF_HOSTING.md` if setup steps change.

## Security Notes

- Provider keys must stay server-side.
- Webhook routes should validate secrets or signatures where available.
- Public song pages can expose public media URLs only after authorization and
  visibility checks.
- Private dashboard and report routes should require Supabase sessions.
