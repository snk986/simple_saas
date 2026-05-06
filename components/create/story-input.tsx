"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LyricsEditor } from "./lyrics-editor";
import type { StyleParams } from "@/types/song";

interface LyricsResult {
  songId: string;
  title: string;
  lyrics: string;
  style_key: string;
  style_params: StyleParams;
  style_tags: string[];
  lyrics_regen_count: number;
}

export function StoryInput() {
  const t = useTranslations();
  const params = useParams<{ locale?: string }>();
  const [story, setStory] = useState("");
  const [result, setResult] = useState<LyricsResult | null>(null);
  const [editableLyrics, setEditableLyrics] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  async function submitLyrics(options?: { regenerate?: boolean }) {
    const regenerate = options?.regenerate ?? false;
    const trimmedStory = story.trim();

    if (!trimmedStory || trimmedStory.length < 10) {
      setError(t("create.inputTooShort"));
      return;
    }

    setError("");
    regenerate ? setIsRegenerating(true) : setIsGenerating(true);

    try {
      const response = await fetch("/api/generate/lyrics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userInput: trimmedStory,
          locale: params.locale ?? "en",
          songId: regenerate ? result?.songId : undefined,
          currentLyrics: regenerate ? editableLyrics : undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("errors.generationFailed"));
      }

      setResult(data);
      setEditableLyrics(data.lyrics);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : t("errors.generationFailed");
      setError(
        message === "Content flagged" ? t("errors.contentFlagged") : message,
      );
    } finally {
      regenerate ? setIsRegenerating(false) : setIsGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <section className="rounded-lg border bg-background p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4">
          <h1 className="text-3xl font-semibold tracking-normal">
            {t("create.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("create.subtitle")}
          </p>
        </div>

        <Textarea
          value={story}
          maxLength={2000}
          onChange={(event) => setStory(event.target.value)}
          placeholder={t("create.inputPlaceholder")}
          className="min-h-[260px] resize-y text-base leading-7"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("create.inputHint")}</span>
          <span>{story.length}/2000</span>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          disabled={isGenerating || isRegenerating}
          onClick={() => submitLyrics()}
          className="mt-5 w-full gap-2"
        >
          <Wand2 className={isGenerating ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
          {isGenerating ? t("create.generating") : t("create.generateLyrics")}
        </Button>
      </section>

      {result ? (
        <LyricsEditor
          title={result.title}
          lyrics={editableLyrics}
          styleTags={result.style_tags}
          styleParams={result.style_params}
          regenCount={result.lyrics_regen_count}
          isRegenerating={isRegenerating}
          onLyricsChange={setEditableLyrics}
          onRegenerate={() => submitLyrics({ regenerate: true })}
        />
      ) : (
        <section className="flex min-h-[560px] items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          {t("create.emptyState")}
        </section>
      )}
    </div>
  );
}
