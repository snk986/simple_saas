"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { defaultLocale, type Locale } from "@/i18n/routing";

interface LyricsOnlyGeneratorFormProps {
  labels: {
    prompt: string;
    placeholder: string;
    style: string;
    stylePlaceholder: string;
    styleDefault: string;
    title: string;
    titlePlaceholder: string;
    titleDefault: string;
    submit: string;
    submitting: string;
    signInTitle: string;
    signInDescription: string;
    signInCta: string;
    errorFallback: string;
    resultEyebrow: string;
    lyricsLabel: string;
    turnIntoSong: string;
  };
}

interface LyricsResponse {
  songId: string;
  title: string;
  lyrics: string;
  error?: string;
}

function localePrefix(locale: string) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function LyricsOnlyGeneratorForm({
  labels,
}: LyricsOnlyGeneratorFormProps) {
  const locale = useLocale() as Locale;
  const prefix = localePrefix(locale);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(labels.styleDefault);
  const [title, setTitle] = useState(labels.titleDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LyricsResponse | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setNeedsSignIn(false);
    setError(null);

    try {
      const userInput = [
        "Mode: AI Lyrics Generator",
        title.trim() ? `Title: ${title.trim()}` : null,
        style.trim() ? `Style: ${style.trim()}` : null,
        `Prompt: ${prompt.trim()}`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch("/api/generate/lyrics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userInput,
          locale,
        }),
      });
      const data = (await response.json()) as LyricsResponse;

      if (response.status === 401) {
        setNeedsSignIn(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? labels.errorFallback);
      }

      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : labels.errorFallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
      >
        <div>
          <label className="text-sm font-medium text-foreground">
            {labels.prompt}
          </label>
          <textarea
            className="mt-2 min-h-36 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={labels.placeholder}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={2000}
            required
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            {labels.style}
            <input
              className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={labels.stylePlaceholder}
              value={style}
              onChange={(event) => setStyle(event.target.value)}
              maxLength={300}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            {labels.title}
            <input
              className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={labels.titlePlaceholder}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
            />
          </label>
        </div>

        {needsSignIn ? (
          <div className="mt-4 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
            <p className="font-medium">{labels.signInTitle}</p>
            <p className="mt-1 text-muted-foreground">
              {labels.signInDescription}
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href={`${prefix}/sign-in`}>{labels.signInCta}</Link>
            </Button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || prompt.trim().length < 10}
          className="mt-5 w-full gap-2 md:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {isSubmitting ? labels.submitting : labels.submit}
        </Button>
      </form>

      {result ? (
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <FileText className="h-4 w-4" />
            {labels.resultEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">
            {result.title}
          </h2>
          <label className="mt-4 block text-sm font-medium">
            {labels.lyricsLabel}
            <textarea
              readOnly
              value={result.lyrics}
              className="mt-2 min-h-80 w-full resize-y rounded-md border border-input bg-background px-3 py-3 font-mono text-sm leading-6 outline-none"
            />
          </label>
          <Button asChild className="mt-4 gap-2">
            <Link
              href={`${prefix}/ai-lyrics-to-song?ref=song&id=${result.songId}`}
            >
              {labels.turnIntoSong}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}
