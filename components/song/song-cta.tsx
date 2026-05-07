"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SongCtaProps {
  songId: string;
  createHref: string;
  labels: {
    title: string;
    description: string;
    create: string;
    copy: string;
  };
}

async function countCta(songId: string) {
  await fetch(`/api/song/${songId}/count`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "cta_click" }),
    keepalive: true,
  }).catch(() => undefined);
}

export function SongCta({ songId, createHref, labels }: SongCtaProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)] dark:border-slate-800 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Sparkles className="h-5 w-5 text-emerald-300" />
          </div>
          <h2 className="text-2xl font-semibold">{labels.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {labels.description}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="gap-2 bg-white text-slate-950 hover:bg-slate-100"
            onClick={() => void countCta(songId)}
          >
            <Link href={createHref}>
              {labels.create}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href);
              void fetch(`/api/song/${songId}/count`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "share" }),
                keepalive: true,
              }).catch(() => undefined);
            }}
          >
            <Copy className="h-4 w-4" />
            {labels.copy}
          </Button>
        </div>
      </div>
    </section>
  );
}
