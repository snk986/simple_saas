"use client";

import { ArrowRight, Flag } from "lucide-react";
import Link from "next/link";

const PENDING_DRAFT_STORAGE_PREFIX = "calyra:pendingDraft:";

interface WorldCupPromptCardProps {
  href: string;
  country: string;
  vibe: string;
  prompt: string;
  style: string;
  title: string;
}

export function WorldCupPromptCard({
  href,
  country,
  vibe,
  prompt,
  style,
  title,
}: WorldCupPromptCardProps) {
  const handleClick = () => {
    window.sessionStorage.setItem(
      `${PENDING_DRAFT_STORAGE_PREFIX}${href}`,
      JSON.stringify({ prompt, style, title }),
    );
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="group w-full rounded-lg border border-white/10 bg-white/[0.045] p-5 text-left transition-colors hover:border-emerald-300/50 hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
    >
      <Flag className="h-5 w-5 text-emerald-200" />
      <h3 className="mt-4 text-lg font-semibold tracking-normal">
        {country} Fan Song
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{vibe}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-200">
        Use this prompt
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
