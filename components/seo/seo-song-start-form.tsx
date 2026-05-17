"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { defaultLocale, type Locale } from "@/i18n/routing";

type SongStartMode = "text" | "lyrics";

interface SeoSongStartFormProps {
  mode: SongStartMode;
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
  };
}

function localizedCreatePath(locale: string) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/create`;
}

export function SeoSongStartForm({ mode, labels }: SeoSongStartFormProps) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(labels.styleDefault);
  const [title, setTitle] = useState(labels.titleDefault);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams({
      mode,
      prompt: prompt.trim(),
      style: style.trim(),
      title: title.trim(),
    });

    router.push(`${localizedCreatePath(locale)}?${params.toString()}`);
  };

  return (
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

      <Button
        type="submit"
        size="lg"
        disabled={prompt.trim().length < 10}
        className="mt-5 w-full gap-2 md:w-auto"
      >
        {labels.submit}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
