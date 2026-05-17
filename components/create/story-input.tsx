"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Heart,
  MoreHorizontal,
  Play,
  Search,
  SlidersHorizontal,
  Wand2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { StyleParams } from "@/types/song";

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
  canDownload: boolean;
  creditsBalance: number;
  initialPrompt?: string | null;
  initialStyle?: string | null;
  initialTitle?: string | null;
  initialMode?: "text" | "lyrics";
  initialJobId?: string | null;
  initialWorkspaceSongs: Array<{
    id: string;
    title: string;
    user_input: string;
    style_tags: string[] | null;
    status: "draft" | "generating" | "ready" | "failed" | "expired";
    is_public: boolean;
    cover_url: string | null;
    audio_url: string | null;
    created_at: string;
    audio_provider: string;
    audio_provider_task_id: string;
    like_count: number | null;
  }>;
}

type WorkspaceSongStatus = "draft" | "processing" | "completed" | "failed";
type WorkspaceFilter = "all" | "liked" | "public" | "uploads";

interface WorkspaceSongItem {
  id: string;
  title: string;
  promptSummary: string;
  styleSummary: string;
  status: WorkspaceSongStatus;
  isPublic: boolean;
  coverUrl: string | null;
  audioUrl: string | null;
  modelTag: string;
  versionTag: string;
  liked: boolean;
  createdAt: string;
  taskId?: string | null;
}

interface GenerationCreateResponse {
  jobId: string;
  songId: string;
  taskId: string;
  status: "processing";
}

interface GenerationJobPayload {
  jobId: string;
  songId: string;
  taskId?: string | null;
  status: "idle" | "processing" | "completed" | "failed";
  title: string;
  userInput: string;
  style_tags: string[];
  audio_url?: string | null;
  cover_url?: string | null;
}

const STYLE_TAGS = [
  "Pop",
  "Rap",
  "Rock",
  "EDM",
  "Anime",
  "Lo-fi",
  "Country",
  "Cinematic",
  "Sad",
  "Happy",
  "Female Vocal",
  "Male Vocal",
];

function normalizeStatus(
  status: "draft" | "generating" | "ready" | "failed" | "expired",
): WorkspaceSongStatus {
  if (status === "ready") return "completed";
  if (status === "generating") return "processing";
  if (status === "failed" || status === "expired") return "failed";
  return "draft";
}

function formatDuration(seconds: number | null) {
  if (!seconds || Number.isNaN(seconds)) {
    return "--:--";
  }
  const total = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function StoryInput({
  initialDraft,
  canDownload,
  creditsBalance,
  initialPrompt,
  initialStyle,
  initialTitle,
  initialMode = "text",
  initialJobId,
  initialWorkspaceSongs,
}: StoryInputProps) {
  const { toast } = useToast();
  const params = useParams<{ locale?: string }>();
  const localePrefix =
    params.locale && params.locale !== "en" ? `/${params.locale}` : "";

  const [mode, setMode] = useState<"text" | "lyrics">(initialMode);
  const [prompt, setPrompt] = useState(initialPrompt ?? initialDraft?.userInput ?? "");
  const [style, setStyle] = useState(initialStyle ?? "");
  const [title, setTitle] = useState(initialTitle ?? initialDraft?.title ?? "My AI Song");
  const [instrumental, setInstrumental] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAction, setErrorAction] = useState<"sign-in" | "pricing" | null>(
    null,
  );
  const [workspaceSongs, setWorkspaceSongs] = useState<WorkspaceSongItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WorkspaceFilter>("all");
  const [durations, setDurations] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const mapped: WorkspaceSongItem[] = initialWorkspaceSongs.map((song) => ({
      id: song.id,
      title: song.title,
      promptSummary: song.user_input,
      styleSummary: (song.style_tags ?? []).join(", "),
      status: normalizeStatus(song.status),
      isPublic: Boolean(song.is_public),
      coverUrl: song.cover_url,
      audioUrl: song.audio_url,
      modelTag: (song.audio_provider ?? "kie").toUpperCase(),
      versionTag: /\(Version B\)$/.test(song.title) ? "V2" : "V1",
      liked: (song.like_count ?? 0) > 0,
      createdAt: song.created_at,
      taskId: song.audio_provider_task_id,
    }));
    setWorkspaceSongs(mapped);
  }, [initialWorkspaceSongs]);

  useEffect(() => {
    if (!initialJobId) return;
    const exists = workspaceSongs.some((song) => song.id === initialJobId);
    if (exists) return;

    void (async () => {
      const response = await fetch(`/api/generations/${encodeURIComponent(initialJobId)}`);
      if (!response.ok) return;
      const data = (await response.json()) as GenerationJobPayload;
      setWorkspaceSongs((current) => [
        {
          id: data.songId,
          title: data.title,
          promptSummary: data.userInput,
          styleSummary: (data.style_tags ?? []).join(", "),
          status:
            data.status === "completed"
              ? "completed"
              : data.status === "failed"
                ? "failed"
                : "processing",
          isPublic: true,
          coverUrl: data.cover_url ?? null,
          audioUrl: data.audio_url ?? null,
          modelTag: "KIE",
          versionTag: "V1",
          liked: false,
          createdAt: new Date().toISOString(),
          taskId: data.taskId ?? null,
        },
        ...current,
      ]);
    })();
  }, [initialJobId, workspaceSongs]);

  useEffect(() => {
    const processingSongs = workspaceSongs.filter((song) => song.status === "processing");
    if (processingSongs.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      processingSongs.forEach((song) => {
        void (async () => {
          const response = await fetch(`/api/generations/${encodeURIComponent(song.id)}`, {
            cache: "no-store",
          });
          if (!response.ok) return;
          const data = (await response.json()) as GenerationJobPayload;
          setWorkspaceSongs((current) =>
            current.map((item) =>
              item.id !== song.id
                ? item
                : {
                    ...item,
                    status:
                      data.status === "completed"
                        ? "completed"
                        : data.status === "failed"
                          ? "failed"
                          : "processing",
                    audioUrl: data.audio_url ?? item.audioUrl,
                    coverUrl: data.cover_url ?? item.coverUrl,
                  },
            ),
          );
        })();
      });
    }, 3000);

    return () => window.clearInterval(timer);
  }, [workspaceSongs]);

  useEffect(() => {
    workspaceSongs.forEach((song) => {
      if (!song.audioUrl || song.id in durations) return;
      const audio = new Audio(song.audioUrl);
      audio.preload = "metadata";
      const onLoaded = () => {
        setDurations((current) => ({ ...current, [song.id]: audio.duration }));
      };
      const onError = () => {
        setDurations((current) => ({ ...current, [song.id]: null }));
      };
      audio.addEventListener("loadedmetadata", onLoaded);
      audio.addEventListener("error", onError);
      audio.load();
    });
  }, [workspaceSongs, durations]);

  const filteredSongs = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return workspaceSongs
      .filter((song) => {
        if (filter === "liked" && !song.liked) return false;
        if (filter === "public" && !song.isPublic) return false;
        if (filter === "uploads") return true;
        return true;
      })
      .filter((song) => {
        if (!searchLower) return true;
        return (
          song.title.toLowerCase().includes(searchLower) ||
          song.promptSummary.toLowerCase().includes(searchLower) ||
          song.styleSummary.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [filter, search, workspaceSongs]);

  const submitGeneration = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast({
        variant: "destructive",
        description: "Please provide more details before generating.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt,
          style,
          title,
          locale: params.locale ?? "en",
          instrumental,
        }),
      });

      if (response.status === 401) {
        setErrorAction("sign-in");
        return;
      }

      if (response.status === 402) {
        setErrorAction("pricing");
        return;
      }

      const data = (await response.json()) as GenerationCreateResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed");
      }

      const optimistic: WorkspaceSongItem = {
        id: data.jobId,
        title: title.trim() || "Untitled Song",
        promptSummary: prompt,
        styleSummary: style,
        status: "processing",
        isPublic: true,
        coverUrl: null,
        audioUrl: null,
        modelTag: "KIE",
        versionTag: "V1",
        liked: false,
        createdAt: new Date().toISOString(),
        taskId: data.taskId,
      };

      setWorkspaceSongs((current) => [optimistic, ...current.filter((song) => song.id !== optimistic.id)]);

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("jobId", data.jobId);
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      }
    } catch (caught) {
      toast({
        variant: "destructive",
        description:
          caught instanceof Error ? caught.message : "Generation failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const retrySong = async (song: WorkspaceSongItem) => {
    try {
      const job = await fetch(`/api/generations/${encodeURIComponent(song.id)}`, {
        cache: "no-store",
      });
      if (!job.ok) {
        throw new Error("Failed to load song for retry");
      }
      const detail = (await job.json()) as GenerationJobPayload & { lyrics?: string };
      const response = await fetch("/api/generate/audio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          songId: song.id,
          lyrics: detail.lyrics,
        }),
      });
      const data = await response.json();
      if (response.status === 402) {
        setErrorAction("pricing");
        return;
      }
      if (!response.ok) {
        throw new Error(data.error ?? "Retry failed");
      }

      setWorkspaceSongs((current) =>
        current.map((item) =>
          item.id === song.id
            ? { ...item, status: "processing", taskId: data.taskId ?? item.taskId }
            : item,
        ),
      );
    } catch (caught) {
      toast({
        variant: "destructive",
        description: caught instanceof Error ? caught.message : "Retry failed",
      });
    }
  };

  const appendStyleTag = (tag: string) => {
    const next = style.trim();
    if (!next) {
      setStyle(tag);
      return;
    }
    const exists = next
      .toLowerCase()
      .split(",")
      .map((part) => part.trim())
      .includes(tag.toLowerCase());
    if (!exists) {
      setStyle(`${next}, ${tag}`);
    }
  };

  return (
    <>
      <Dialog
        open={Boolean(errorAction)}
        onOpenChange={(open) => {
          if (!open) {
            setErrorAction(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-lg border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle>Action needed</DialogTitle>
            <DialogDescription>
              {errorAction === "sign-in"
                ? "Please sign in before generating music."
                : "Your credits are too low for this generation."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild className="w-full sm:w-auto">
              <Link
                href={
                  errorAction === "sign-in"
                    ? `${localePrefix}/sign-in`
                    : `${localePrefix}/pricing`
                }
              >
                {errorAction === "sign-in" ? "Sign in" : "Top up credits"}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-white/10 bg-card/90 p-5 shadow-sm shadow-black/20 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Song Generator</h1>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Credits {creditsBalance}
            </span>
          </div>

          <div className="mb-4 inline-flex rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === "text" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >
              Text to Song
            </button>
            <button
              type="button"
              onClick={() => setMode("lyrics")}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === "lyrics" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >
              Lyrics to Song
            </button>
          </div>

          <div className="mb-2">
            <p className="text-sm font-medium">
              {mode === "lyrics" ? "Lyrics" : "Song idea"}
            </p>
            {mode === "text" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Start from an idea. Calyra will write lyrics and generate a full song.
              </p>
            ) : null}
          </div>

          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              mode === "lyrics"
                ? "Paste your lyrics here..."
                : "Describe your song idea, mood, story, or genre..."
            }
            className="min-h-[180px] w-full resize-y text-sm"
          />

          <input
            value={style}
            onChange={(event) => setStyle(event.target.value)}
            placeholder="Style"
            className="mt-3 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => appendStyleTag(tag)}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs"
              >
                {tag}
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="mt-3 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
          />

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={instrumental}
              onChange={(event) => setInstrumental(event.target.checked)}
            />
            Instrumental only (no vocals)
          </label>

          <Button
            type="button"
            size="lg"
            disabled={isSubmitting}
            onClick={submitGeneration}
            className="mt-5 w-full gap-2"
          >
            <Wand2 className={`h-4 w-4 ${isSubmitting ? "animate-pulse" : ""}`} />
            {isSubmitting ? "Generating..." : "Generate Song"}
          </Button>
        </aside>

        <section className="rounded-xl border border-white/10 bg-card p-5 shadow-sm shadow-black/20">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search songs"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Sort: Newest
              </span>
              {(["all", "liked", "public", "uploads"] as WorkspaceFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    filter === item
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {item === "all"
                    ? "All"
                    : item === "liked"
                      ? "Liked"
                      : item === "public"
                        ? "Public"
                        : "Uploads"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredSongs.map((song) => (
              <article
                key={song.id}
                className="rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold">{song.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          song.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : song.status === "failed"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {song.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {song.modelTag} · {song.versionTag} · {formatDuration(durations[song.id] ?? null)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {song.styleSummary || song.promptSummary}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!song.audioUrl}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!song.isPublic || song.status !== "completed") return;
                      void fetch(`/api/song/${song.id}/count`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ event: "like" }),
                        keepalive: true,
                      });
                      setWorkspaceSongs((current) =>
                        current.map((item) =>
                          item.id === song.id ? { ...item, liked: true } : item,
                        ),
                      );
                    }}
                  >
                    <Heart className={`h-3.5 w-3.5 ${song.liked ? "fill-current" : ""}`} />
                  </Button>
                  {song.audioUrl && canDownload ? (
                    <Button asChild type="button" size="sm" variant="outline">
                      <a href={song.audioUrl} download>
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" disabled>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button asChild type="button" size="sm" variant="outline">
                    <Link href={`/report/${song.id}`}>Report</Link>
                  </Button>
                  {song.status === "failed" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => retrySong(song)}
                    >
                      Retry
                    </Button>
                  ) : null}
                  <Button type="button" size="sm" variant="outline">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </article>
            ))}

            {filteredSongs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No songs found.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
