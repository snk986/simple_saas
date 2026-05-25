"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Mode = "text" | "lyrics";
const PENDING_SONG_STORAGE_PREFIX = "calyra:pendingSong:";
const PENDING_DRAFT_STORAGE_PREFIX = "calyra:pendingDraft:";

interface HeroGeneratorFormProps {
  textToSongPath: string;
  lyricsToSongPath: string;
  signInPath: string;
  pricingPath: string;
  locale: string;
  modeTextLabel: string;
  modeLyricsLabel: string;
  promptLabel: string;
  textPlaceholder: string;
  lyricsPlaceholder: string;
  styleLabel: string;
  stylePlaceholder: string;
  styleDefault: string;
  titleLabel: string;
  titlePlaceholder: string;
  titleDefault: string;
  submitLabel: string;
  styleTags: string[];
}

export function HeroGeneratorForm({
  textToSongPath,
  lyricsToSongPath,
  signInPath,
  pricingPath,
  locale,
  modeTextLabel,
  modeLyricsLabel,
  promptLabel,
  textPlaceholder,
  lyricsPlaceholder,
  styleLabel,
  stylePlaceholder,
  styleDefault,
  titleLabel,
  titlePlaceholder,
  titleDefault,
  submitLabel,
  styleTags,
}: HeroGeneratorFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("text");
  const [styleValue, setStyleValue] = useState(styleDefault);
  const [titleValue, setTitleValue] = useState(titleDefault);
  const [promptValue, setPromptValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const promptPlaceholder =
    mode === "lyrics" ? lyricsPlaceholder : textPlaceholder;

  const appendStyleTag = (tag: string) => {
    const trimmed = styleValue.trim();
    if (!trimmed) {
      setStyleValue(tag);
      return;
    }

    const exists = trimmed
      .toLowerCase()
      .split(",")
      .map((part) => part.trim())
      .includes(tag.toLowerCase());

    if (exists) {
      return;
    }

    setStyleValue(`${trimmed}, ${tag}`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const nextPath = mode === "lyrics" ? lyricsToSongPath : textToSongPath;
    const pendingDraftPath = new URL(nextPath, window.location.origin).pathname;

    window.sessionStorage.removeItem(
      `${PENDING_SONG_STORAGE_PREFIX}${pendingDraftPath}`,
    );
    window.sessionStorage.setItem(
      `${PENDING_DRAFT_STORAGE_PREFIX}${pendingDraftPath}`,
      JSON.stringify({
        prompt: promptValue,
        style: styleValue,
        title: titleValue,
        autoSubmit: true,
      }),
    );
    router.push(nextPath);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 max-w-4xl rounded-[30px] border border-white/20 bg-white/[0.07] p-5 shadow-[0_34px_120px_rgba(0,0,0,0.52)] backdrop-blur"
    >
      <input type="hidden" name="mode" value={mode} />

      <div className="inline-flex rounded-xl border border-white/15 bg-black/20 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`rounded-lg px-3 py-2 transition ${
            mode === "text" ? "bg-white text-black" : "text-slate-300"
          }`}
        >
          {modeTextLabel}
        </button>
        <button
          type="button"
          onClick={() => setMode("lyrics")}
          className={`rounded-lg px-3 py-2 transition ${
            mode === "lyrics" ? "bg-white text-black" : "text-slate-300"
          }`}
        >
          {modeLyricsLabel}
        </button>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          {promptLabel}
        </label>
        <textarea
          aria-label={promptLabel}
          className="min-h-28 w-full resize-y rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          placeholder={promptPlaceholder}
          value={promptValue}
          onChange={(event) => setPromptValue(event.target.value)}
          maxLength={2000}
          required
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          {styleLabel}
        </label>
        <input
          name="style"
          aria-label={styleLabel}
          className="h-12 w-full rounded-2xl border border-white/15 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-500"
          placeholder={stylePlaceholder}
          value={styleValue}
          onChange={(event) => setStyleValue(event.target.value)}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2.5">
        {styleTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => appendStyleTag(tag)}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/15"
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          {titleLabel}
        </label>
        <input
          name="title"
          aria-label={titleLabel}
          className="h-12 w-full rounded-2xl border border-white/15 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-500"
          placeholder={titlePlaceholder}
          value={titleValue}
          onChange={(event) => setTitleValue(event.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !promptValue.trim()}
        size="lg"
        className="mt-5 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 px-6 text-base font-black text-white shadow-[0_22px_56px_rgba(139,92,246,0.25)] hover:brightness-110"
      >
        {submitLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
