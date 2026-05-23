"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  ActionNeededDialog,
  type ActionNeededType,
} from "@/components/create/action-needed-dialog";
import { defaultLocale, type Locale } from "@/i18n/routing";
import type { StyleParams } from "@/types/song";

const PENDING_SONG_STORAGE_PREFIX = "calyra:pendingSong:";
const STYLE_PRESETS = [
  "Pop ballad, emotional, memorable chorus",
  "Rap, confident, punchy hook",
  "Rock, anthemic, live band energy",
  "Lo-fi, warm, mellow vocal",
  "EDM, bright, festival chorus",
  "Cinematic, dramatic, powerful build",
];

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
  title: string;
  lyrics: string;
  style_key: string;
  style_params: StyleParams;
  style_tags: string[];
  error?: string;
}

function localePrefix(locale: string) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function LyricsOnlyGeneratorForm({
  labels,
}: LyricsOnlyGeneratorFormProps) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const prefix = localePrefix(locale);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(labels.styleDefault);
  const [title, setTitle] = useState(labels.titleDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LyricsResponse | null>(null);
  const [isGeneratingSong, setIsGeneratingSong] = useState(false);
  const [errorAction, setErrorAction] = useState<ActionNeededType | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setNeedsSignIn(false);
    setErrorAction(null);
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
      setErrorAction("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateSong = async () => {
    if (!result || isGeneratingSong) {
      return;
    }

    setIsGeneratingSong(true);
    setNeedsSignIn(false);
    setErrorAction(null);
    setError(null);

    try {
      const response = await fetch("/api/songs/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "lyrics",
          lyrics: result.lyrics,
          prompt,
          style,
          title: result.title,
          locale,
        }),
      });
      const data = (await response.json()) as {
        songId?: string;
        error?: string;
      };

      if (response.status === 401) {
        setErrorAction("sign-in");
        return;
      }

      if (response.status === 402) {
        setErrorAction("pricing");
        return;
      }

      if (!response.ok || !data.songId) {
        throw new Error(data.error ?? labels.errorFallback);
      }

      const nextPath = `${prefix}/ai-lyrics-to-song`;
      const pendingSongPath = new URL(nextPath, window.location.origin)
        .pathname;
      window.sessionStorage.setItem(
        `${PENDING_SONG_STORAGE_PREFIX}${pendingSongPath}`,
        data.songId,
      );
      router.push(nextPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : labels.errorFallback);
      setErrorAction("error");
    } finally {
      setIsGeneratingSong(false);
    }
  };

  return (
    <div className="grid gap-4">
      <ActionNeededDialog
        action={errorAction}
        localePrefix={prefix}
        errorMessage={error}
        onClose={() => {
          setErrorAction(null);
          setError(null);
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.96fr)_40px_minmax(0,1.04fr)] lg:items-stretch">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5"
        >
          <div>
            <label className="text-sm font-medium text-foreground">
              {labels.prompt}
            </label>
            <textarea
              className="mt-2 min-h-40 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={labels.placeholder}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={2000}
              required
            />
          </div>

          <div className="mt-4 border-t pt-4">
            <label className="block text-sm font-medium text-foreground">
              {labels.style}
              <input
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={labels.stylePlaceholder}
                value={style}
                onChange={(event) => setStyle(event.target.value)}
                maxLength={300}
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setStyle(preset)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {preset.split(",")[0]}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium">
              {labels.title}
              <input
                value={result?.title ?? title}
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setTitle(nextTitle);
                  setResult((current) =>
                    current ? { ...current, title: nextTitle } : current,
                  );
                }}
                placeholder={labels.titlePlaceholder}
                maxLength={120}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>

          {needsSignIn ? (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
              <p className="font-medium">{labels.signInTitle}</p>
              <p className="mt-1 text-muted-foreground">
                {labels.signInDescription}
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href={`${prefix}/sign-in`}>{labels.signInCta}</Link>
              </Button>
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || prompt.trim().length < 10}
            className="mt-5 w-full gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isSubmitting ? labels.submitting : labels.submit}
          </Button>
        </form>

        <div className="hidden items-center justify-center lg:flex">
          <span className="grid h-10 w-10 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>

        <section className="flex min-h-[460px] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <FileText className="h-4 w-4" />
              {labels.resultEyebrow}
            </p>
            <Button
              type="button"
              className="gap-2"
              disabled={
                !result || isGeneratingSong || result.lyrics.trim().length < 20
              }
              onClick={handleGenerateSong}
            >
              {isGeneratingSong ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {labels.turnIntoSong}
            </Button>
          </div>

          <label className="mt-4 flex min-h-0 flex-1 flex-col text-sm font-medium">
            {labels.lyricsLabel}
            <textarea
              value={result?.lyrics ?? ""}
              onChange={(event) =>
                setResult((current) =>
                  current
                    ? { ...current, lyrics: event.target.value }
                    : current,
                )
              }
              disabled={!result}
              placeholder={labels.placeholder}
              className="mt-2 min-h-80 flex-1 resize-y rounded-xl border border-input bg-background px-3 py-3 font-mono text-sm leading-6 outline-none transition disabled:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </section>
      </div>
    </div>
  );
}
