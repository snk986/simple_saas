"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const PENDING_SONG_STORAGE_PREFIX = "calyra:pendingSong:";
const PENDING_DRAFT_STORAGE_PREFIX = "calyra:pendingDraft:";

interface TemplateGenerateButtonProps {
  lyricsToSongPath: string;
  title: string;
  lyrics: string;
  style: string;
  className?: string;
  label?: string;
}

export function TemplateGenerateButton({
  lyricsToSongPath,
  title,
  lyrics,
  style,
  className,
  label = "Generate",
}: TemplateGenerateButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const pendingDraftPath = new URL(
      lyricsToSongPath,
      window.location.origin,
    ).pathname;

    window.sessionStorage.removeItem(
      `${PENDING_SONG_STORAGE_PREFIX}${pendingDraftPath}`,
    );
    window.sessionStorage.setItem(
      `${PENDING_DRAFT_STORAGE_PREFIX}${pendingDraftPath}`,
      JSON.stringify({
        prompt: lyrics,
        style,
        title,
        autoSubmit: true,
      }),
    );

    router.push(lyricsToSongPath);
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting}
      className={className}
    >
      {isSubmitting ? "Sending" : label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
