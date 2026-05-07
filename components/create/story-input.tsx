"use client";

import { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AudioPlayer } from "./audio-player";
import { GenerationStatus } from "./generation-status";
import { LyricsEditor } from "./lyrics-editor";
import type { SelectedAudio, StyleParams } from "@/types/song";

interface LyricsResult {
  songId: string;
  title: string;
  lyrics: string;
  style_key: string;
  style_params: StyleParams;
  style_tags: string[];
  lyrics_regen_count: number;
}

interface AudioResult {
  taskId?: string;
  songId: string;
  audio_url?: string | null;
  audio_url_alt?: string | null;
  cover_url?: string | null;
}

interface InitialDraft {
  songId: string;
  title: string;
  lyrics: string;
  userInput: string;
  style_key: string;
  style_params: StyleParams;
  style_tags: string[];
  lyrics_regen_count: number;
}

interface StoryInputProps {
  initialDraft?: InitialDraft | null;
  recallCampaign?: string | null;
}

export function StoryInput({ initialDraft, recallCampaign }: StoryInputProps) {
  const t = useTranslations();
  const params = useParams<{ locale?: string }>();
  const [story, setStory] = useState(initialDraft?.userInput ?? "");
  const [result, setResult] = useState<LyricsResult | null>(
    initialDraft
      ? {
          songId: initialDraft.songId,
          title: initialDraft.title,
          lyrics: initialDraft.lyrics,
          style_key: initialDraft.style_key,
          style_params: initialDraft.style_params,
          style_tags: initialDraft.style_tags,
          lyrics_regen_count: initialDraft.lyrics_regen_count,
        }
      : null,
  );
  const [editableLyrics, setEditableLyrics] = useState(initialDraft?.lyrics ?? "");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [audioStatus, setAudioStatus] = useState<
    "idle" | "processing" | "completed" | "failed" | "timeout"
  >("idle");
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<SelectedAudio>("primary");
  const [isSelectingAudio, setIsSelectingAudio] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (audioStatus !== "processing") {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [audioStatus]);

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
      setAudioStatus("idle");
      setAudioResult(null);
      setElapsedSeconds(0);
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

  async function generateMusic() {
    if (!result) {
      return;
    }

    setError("");
    setElapsedSeconds(0);
    setAudioStatus("processing");
    setAudioResult(null);

    try {
      const response = await fetch("/api/generate/audio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          songId: result.songId,
          lyrics: editableLyrics,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Audio generation failed");
      }

      setAudioResult({ songId: data.songId, taskId: data.taskId });
      await pollAudioStatus(data.taskId, data.songId);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Audio generation failed";
      setError(message);
      setAudioStatus("failed");
    }
  }

  async function pollAudioStatus(taskId: string, songId: string) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const response = await fetch(
        `/api/generate/audio/status?taskId=${encodeURIComponent(taskId)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to check audio status");
      }

      if (data.status === "completed") {
        setAudioResult({
          songId,
          taskId,
          audio_url: data.audio_url,
          audio_url_alt: data.audio_url_alt,
          cover_url: data.cover_url,
        });
        setSelectedAudio("primary");
        setAudioStatus("completed");
        return;
      }

      if (data.status === "failed") {
        throw new Error(data.error ?? "Audio generation failed");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
    }

    setAudioResult({ songId, taskId });
    setAudioStatus("timeout");
  }

  async function selectAudio(nextSelectedAudio: SelectedAudio) {
    if (!audioResult) {
      return;
    }

    setIsSelectingAudio(true);
    setError("");

    try {
      const response = await fetch(`/api/song/${audioResult.songId}/select`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedAudio: nextSelectedAudio }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to select audio");
      }

      setSelectedAudio(nextSelectedAudio);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Failed to select audio";
      setError(message);
    } finally {
      setIsSelectingAudio(false);
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

        {recallCampaign === "inactive_creator" ? (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {t("create.recall.inactiveCreator")}
          </div>
        ) : null}

        {initialDraft ? (
          <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
            {t("create.recall.draftNoAudio")}
          </div>
        ) : null}

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
          disabled={isGenerating || isRegenerating || audioStatus === "processing"}
          onClick={() => submitLyrics()}
          className="mt-5 w-full gap-2"
        >
          <Wand2 className={isGenerating ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
          {isGenerating ? t("create.generating") : t("create.generateLyrics")}
        </Button>
      </section>

      {result ? (
        <div className="grid gap-6">
          <LyricsEditor
            title={result.title}
            lyrics={editableLyrics}
            styleTags={result.style_tags}
            styleParams={result.style_params}
            regenCount={result.lyrics_regen_count}
            isRegenerating={isRegenerating}
            isGeneratingMusic={audioStatus === "processing"}
            onLyricsChange={setEditableLyrics}
            onRegenerate={() => submitLyrics({ regenerate: true })}
            onGenerateMusic={generateMusic}
          />
          <GenerationStatus
            status={audioStatus}
            elapsedSeconds={elapsedSeconds}
          />
          {audioResult?.audio_url && audioStatus === "completed" ? (
            <AudioPlayer
              songId={audioResult.songId}
              title={result.title}
              coverUrl={audioResult.cover_url}
              audioUrl={audioResult.audio_url}
              audioUrlAlt={audioResult.audio_url_alt}
              selectedAudio={selectedAudio}
              isSelecting={isSelectingAudio}
              onSelect={selectAudio}
            />
          ) : null}
        </div>
      ) : (
        <section className="flex min-h-[560px] items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          {t("create.emptyState")}
        </section>
      )}
    </div>
  );
}
