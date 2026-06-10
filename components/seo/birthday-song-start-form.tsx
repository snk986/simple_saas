"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, Cake, Music2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
import { defaultLocale, type Locale } from "@/i18n/routing";

const PENDING_DRAFT_STORAGE_PREFIX = "calyra:pendingDraft:";

interface BirthdaySongStartFormProps {
  labels: {
    name: string;
    namePlaceholder: string;
    recipient: string;
    message: string;
    messagePlaceholder: string;
    vibe: string;
    style: string;
    styleDefault: string;
    submit: string;
    badge: string;
    options: {
      mom: string;
      dad: string;
      partner: string;
      friend: string;
      child: string;
      coworker: string;
      warm: string;
      funny: string;
      emotional: string;
      upbeat: string;
      surprise: string;
    };
  };
}

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function BirthdaySongStartForm({ labels }: BirthdaySongStartFormProps) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const [name, setName] = useState("");
  const [recipient, setRecipient] = useState(labels.options.friend);
  const [vibe, setVibe] = useState(labels.options.warm);
  const [style, setStyle] = useState(labels.styleDefault);
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const prompt = [
      `Create a personalized happy birthday song for ${name.trim()}.`,
      `Recipient: ${recipient}.`,
      `Birthday mood: ${vibe}.`,
      message.trim()
        ? `Personal details and wishes: ${message.trim()}`
        : "Use warm birthday wishes, a memorable chorus, and natural name mentions.",
      "Include the name naturally in the chorus and make the song feel like a gift.",
    ].join("\n");

    const nextPath = `${localePrefix(locale)}${SEO_TOOL_PAGE_PATHS.aiTextToSong}`;
    const pendingDraftKey = `${PENDING_DRAFT_STORAGE_PREFIX}${nextPath}`;
    window.sessionStorage.setItem(
      pendingDraftKey,
      JSON.stringify({
        prompt,
        style,
        title: `Happy Birthday ${name.trim()}`,
      }),
    );

    const params = new URLSearchParams({
      utm_campaign: "ai_birthday_song_generator",
    });

    router.push(`${nextPath}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-4 shadow-sm md:p-5"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Cake className="h-4 w-4" />
        {labels.badge}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          {labels.name}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={labels.namePlaceholder}
            maxLength={80}
            required
            className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          {labels.recipient}
          <select
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option>{labels.options.mom}</option>
            <option>{labels.options.dad}</option>
            <option>{labels.options.partner}</option>
            <option>{labels.options.friend}</option>
            <option>{labels.options.child}</option>
            <option>{labels.options.coworker}</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block text-sm font-medium text-foreground">
        {labels.vibe}
        <select
          value={vibe}
          onChange={(event) => setVibe(event.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option>{labels.options.warm}</option>
          <option>{labels.options.funny}</option>
          <option>{labels.options.emotional}</option>
          <option>{labels.options.upbeat}</option>
          <option>{labels.options.surprise}</option>
        </select>
      </label>

      <label className="mt-3 block text-sm font-medium text-foreground">
        {labels.message}
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={labels.messagePlaceholder}
          maxLength={1000}
          className="mt-2 min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <label className="mt-3 block text-sm font-medium text-foreground">
        {labels.style}
        <input
          value={style}
          onChange={(event) => setStyle(event.target.value)}
          maxLength={240}
          className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <Button
        type="submit"
        size="lg"
        disabled={name.trim().length < 1}
        className="mt-5 w-full gap-2"
      >
        <Music2 className="h-4 w-4" />
        {labels.submit}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
