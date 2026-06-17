# Open Source Maintenance Plan

This document explains how Calyra AI is maintained as an open-source project and
how the repository differs from a private hosted SaaS deployment.

## Project Positioning

Calyra AI is a self-hostable AI music generation platform starter. It gives
developers a working reference implementation for:

- Prompt-to-song and lyrics-to-song generation.
- AI lyrics drafting and editable generation workflows.
- Audio generation provider adapters.
- Public song pages, sharing, dashboards, and creator reports.
- Supabase-backed auth, storage, credits, and private account data.
- Payment-ready commercial deployment patterns.
- Multilingual SEO and product pages.

The hosted Calyra AI service may be operated commercially, but the repository is
maintained as reusable open-source software. Developers can fork it, replace
providers, bring their own keys, and self-host their own version.

## Fork History and Transformation

The repository started from a SaaS starter fork. It has since been substantially
rebuilt into an AI music generation system. Major transformation areas include:

- AI lyrics and prompt generation architecture.
- Audio provider abstraction and webhook-based finalization.
- Public song pages with media playback, sharing, and SEO metadata.
- Creator dashboard, credits, pricing, and subscription flows.
- Internationalized routes and messages for multiple locales.
- Music-specific style configuration, song templates, reports, and gallery
  features.
- Operational documentation for open-source setup and contribution.

The ongoing maintenance goal is to make the project useful beyond one hosted
deployment by improving docs, provider contracts, testability, security, and
self-hosting ergonomics.

## Maintainer Responsibilities

The primary maintainer is responsible for:

- Reviewing and merging pull requests.
- Triaging issues and reproducing provider-specific bugs.
- Keeping setup documentation current as providers change.
- Reviewing security-sensitive routes, webhooks, and service-role usage.
- Maintaining release notes and upgrade guidance.
- Keeping translations, SEO pages, and public routes aligned with the product
  architecture.

## Current Open Source Priorities

1. Document reliable self-hosting with Supabase and Vercel.
2. Add provider contract tests for `lib/audio/` and `lib/ai/`.
3. Improve webhook verification examples for fal.ai, kie.ai, and wavespeed.ai.
4. Add seed data and local development fixtures for generated songs.
5. Expand issue labels, roadmap milestones, and contributor onboarding.
6. Improve accessibility and mobile stability for generation and public song
   pages.
7. Continue separating provider-specific logic from core product flows.

## How Codex Helps This OSS Project

Codex is useful for maintenance work that is hard to keep up with manually:

- Reviewing pull requests for security, provider leaks, and RLS mistakes.
- Generating focused tests for provider adapters and API route behavior.
- Refactoring provider-specific code back into stable contracts.
- Updating setup docs when environment variables or provider APIs change.
- Triaging issues by reproducing failures and identifying affected modules.
- Checking i18n coverage and public SEO pages for regressions.
- Preparing release notes and migration notes for contributors.

## Application Summary for OSS Programs

Suggested short description:

> Calyra AI is a self-hostable open-source AI music generation platform built
> with Next.js, Supabase, and pluggable AI/audio providers. It helps developers
> build prompt-to-song and lyrics-to-song products with auth, storage, credits,
> public song pages, i18n, payment-ready flows, and provider webhooks. The
> project began as a SaaS starter fork but has been substantially rebuilt into an
> AI music platform, and the current maintenance focus is making it easier for
> developers to fork, deploy, replace providers, and contribute.

Suggested maintainer role statement:

> I am the primary maintainer of this fork and lead the AI music platform
> transformation, including provider abstraction, generation workflows, public
> song pages, i18n, documentation, security review, and release preparation.

Suggested Codex usage statement:

> I would use Codex for open-source maintenance: reviewing provider and webhook
> changes, generating adapter tests, triaging issues, improving Supabase/RLS
> safety, keeping docs current, and preparing releases for contributors who want
> to self-host or extend the platform.
