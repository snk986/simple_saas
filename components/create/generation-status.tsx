"use client";

import { CheckCircle2, Clock3, Loader2, Sparkles, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationStatusProps {
  status: "idle" | "processing" | "completed" | "failed" | "timeout";
  elapsedSeconds: number;
}

function getStatusCopy(elapsedSeconds: number) {
  if (elapsedSeconds < 8) {
    return "Composing the arrangement";
  }

  if (elapsedSeconds < 16) {
    return "Shaping the vocal take";
  }

  if (elapsedSeconds < 40) {
    return "Rendering two track options";
  }

  return "Caching final audio for the public song page";
}

export function GenerationStatus({
  status,
  elapsedSeconds,
}: GenerationStatusProps) {
  const steps = [
    {
      label: "Queued",
      active: status !== "idle",
      done: status === "processing" || status === "completed",
    },
    {
      label: "Generating",
      active: status === "processing",
      done: status === "completed",
    },
    {
      label: "Saved",
      active: status === "completed",
      done: status === "completed",
    },
  ];

  if (status === "idle") {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="rounded-lg border bg-background p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            {status === "processing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "completed" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Clock3 className="h-4 w-4" />
            )}
            Music generation
          </div>
          <h2 className="mt-2 text-xl font-semibold">
            {status === "processing"
              ? getStatusCopy(elapsedSeconds)
              : status === "completed"
                ? "Your track options are ready"
                : status === "timeout"
                  ? "Still working in the background"
                  : "Audio generation needs another try"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === "processing"
              ? "Keep this page open while we prepare the song and cache assets for sharing."
              : status === "completed"
                ? "Choose the version that should power the public song page."
                : status === "timeout"
                  ? "You can check your dashboard later; the task id is safely stored with the song."
                  : "No credits are kept for failed generation attempts."}
          </p>
        </div>

        <div className="flex h-16 items-end gap-1" aria-hidden="true">
          {[10, 24, 38, 20, 46, 28, 16].map((height, index) => (
            <span
              key={height + index}
              className={cn(
                "w-2 rounded-full bg-primary/70 transition-all",
                status === "processing" && "animate-pulse",
              )}
              style={{
                height,
                animationDelay: `${index * 90}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              step.active || step.done
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "bg-muted/30 text-muted-foreground",
            )}
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : index === 1 && status === "processing" ? (
              <Waves className="h-4 w-4 text-primary" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {step.label}
          </li>
        ))}
      </ol>
    </section>
  );
}
