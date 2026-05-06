"use client";

import { Music2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { StyleParams } from "@/types/song";

interface LyricsEditorProps {
  title: string;
  lyrics: string;
  styleTags: string[];
  styleParams: StyleParams | null;
  regenCount: number;
  isRegenerating: boolean;
  onLyricsChange: (lyrics: string) => void;
  onRegenerate: () => void;
}

export function LyricsEditor({
  title,
  lyrics,
  styleTags,
  styleParams,
  regenCount,
  isRegenerating,
  onLyricsChange,
  onRegenerate,
}: LyricsEditorProps) {
  const remaining = Math.max(3 - regenCount, 0);

  return (
    <section className="rounded-lg border bg-background p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Music2 className="h-4 w-4" />
            Lyrics Draft
          </div>
          <h2 className="break-words text-2xl font-semibold">{title}</h2>
          {styleParams ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {styleParams.genre} · {styleParams.bpm} BPM · {styleParams.mood}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onRegenerate}
          disabled={isRegenerating || remaining === 0}
          className="shrink-0 gap-2"
        >
          <RefreshCw
            className={isRegenerating ? "h-4 w-4 animate-spin" : "h-4 w-4"}
          />
          Regenerate ({remaining})
        </Button>
      </div>

      {styleTags.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {styleTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <Textarea
        value={lyrics}
        onChange={(event) => onLyricsChange(event.target.value)}
        className="min-h-[520px] resize-y font-mono text-sm leading-6"
      />
    </section>
  );
}
