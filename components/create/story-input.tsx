"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Pause, Play, Search, SlidersHorizontal, Wand2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  ActionNeededDialog,
  type ActionNeededType,
} from "@/components/create/action-needed-dialog";
import { SongDownloadButton } from "@/components/song/song-download-button";

interface StoryInputProps {
  recallCampaign?: string | null;
  canDownload: boolean;
  initialPrompt?: string | null;
  initialStyle?: string | null;
  initialTitle?: string | null;
  initialMode?: "text" | "lyrics";
  initialSongId?: string | null;
  cleanUrl?: boolean;
  paymentSuccessTitle?: string;
  paymentSuccessDescription?: string;
  modeRoutes?: {
    text: string;
    lyrics: string;
  };
  initialWorkspaceSongs: Array<{
    id: string;
    title: string;
    user_input: string;
    style_tags: string[] | null;
    status: "generating" | "ready" | "failed" | "expired";
    is_public: boolean;
    cover_url: string | null;
    audio_url: string | null;
    created_at: string;
  }>;
}

type WorkspaceSongStatus = "processing" | "completed";
type WorkspaceFilter = "all" | "public" | "uploads";

interface WorkspaceSongItem {
  id: string;
  title: string;
  promptSummary: string;
  styleSummary: string;
  status: WorkspaceSongStatus;
  isPublic: boolean;
  coverUrl: string | null;
  audioUrl: string | null;
  versionTag: string | null;
  createdAt: string;
}

interface GenerationCreateResponse {
  songId: string;
  status: "generating";
  title: string;
}

interface SongStatusPayload {
  songId: string;
  status: "generating" | "completed" | "failed";
  title: string;
  userInput: string;
  styleTags: string[];
  audioUrl?: string | null;
  coverUrl?: string | null;
  errorMessage?: string | null;
}

const STYLE_TAGS = [
  { value: "Pop", key: "styleTags.pop" },
  { value: "Rap", key: "styleTags.rap" },
  { value: "Rock", key: "styleTags.rock" },
  { value: "EDM", key: "styleTags.edm" },
  { value: "Anime", key: "styleTags.anime" },
  { value: "Lo-fi", key: "styleTags.lofi" },
  { value: "Country", key: "styleTags.country" },
  { value: "Cinematic", key: "styleTags.cinematic" },
  { value: "Sad", key: "styleTags.sad" },
  { value: "Happy", key: "styleTags.happy" },
  { value: "Female Vocal", key: "styleTags.femaleVocal" },
  { value: "Male Vocal", key: "styleTags.maleVocal" },
] as const;

const CREEM_CHECKOUT_QUERY_KEYS = [
  "checkout_id",
  "order_id",
  "customer_id",
  "product_id",
  "subscription_id",
  "signature",
];
const PENDING_SONG_STORAGE_PREFIX = "calyra:pendingSong:";
const PENDING_DRAFT_STORAGE_PREFIX = "calyra:pendingDraft:";

type PendingDraftPayload = {
  prompt?: string;
  style?: string;
  title?: string;
  autoSubmit?: boolean;
};

function normalizeStatus(
  status: "generating" | "ready" | "failed" | "expired",
): WorkspaceSongStatus | null {
  if (status === "ready") return "completed";
  if (status === "generating") return "processing";
  return null;
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
  canDownload,
  initialPrompt,
  initialStyle,
  initialTitle,
  initialMode = "text",
  initialSongId,
  cleanUrl = false,
  paymentSuccessTitle,
  paymentSuccessDescription,
  modeRoutes,
  initialWorkspaceSongs,
}: StoryInputProps) {
  const t = useTranslations("create.songMaker");
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const localePrefix =
    params.locale && params.locale !== "en" ? `/${params.locale}` : "";

  const [mode, setMode] = useState<"text" | "lyrics">(initialMode);
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [style, setStyle] = useState(initialStyle ?? "");
  const [title, setTitle] = useState(initialTitle ?? t("titleDefault"));
  const [pendingInitialSongId, setPendingInitialSongId] = useState<
    string | null
  >(initialSongId ?? null);
  const [instrumental, setInstrumental] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<ActionNeededType | null>(null);
  const [queuedDraft, setQueuedDraft] = useState<PendingDraftPayload | null>(
    null,
  );
  const [workspaceSongs, setWorkspaceSongs] = useState<WorkspaceSongItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WorkspaceFilter>("all");
  const [durations, setDurations] = useState<Record<string, number | null>>({});
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const pollAttemptsRef = useRef<Record<string, number>>({});
  const pollInFlightRef = useRef<Record<string, boolean>>({});
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const pendingSongKey = `${PENDING_SONG_STORAGE_PREFIX}${window.location.pathname}`;
    const pendingSongId = window.sessionStorage.getItem(pendingSongKey);
    if (pendingSongId) {
      window.sessionStorage.removeItem(pendingSongKey);
      setPendingInitialSongId(pendingSongId);
    }

    const pendingDraftKey = `${PENDING_DRAFT_STORAGE_PREFIX}${window.location.pathname}`;
    const pendingDraftRaw = window.sessionStorage.getItem(pendingDraftKey);
    if (pendingDraftRaw) {
      window.sessionStorage.removeItem(pendingDraftKey);

      try {
        const pendingDraft = JSON.parse(pendingDraftRaw) as PendingDraftPayload;
        if (typeof pendingDraft.prompt === "string") {
          setPrompt(pendingDraft.prompt);
        }
        if (typeof pendingDraft.style === "string") {
          setStyle(pendingDraft.style);
        }
        if (typeof pendingDraft.title === "string") {
          setTitle(pendingDraft.title);
        }
        if (pendingDraft.autoSubmit) {
          setQueuedDraft(pendingDraft);
        }
      } catch {
        window.sessionStorage.removeItem(pendingDraftKey);
      }
    }

    if (cleanUrl) {
      const cleanPath = `${window.location.pathname}${window.location.hash}`;
      if (window.location.search) {
        window.history.replaceState({}, "", cleanPath);
      }
      return;
    }

    const url = new URL(window.location.href);
    const hasCheckoutParams = CREEM_CHECKOUT_QUERY_KEYS.some((key) =>
      url.searchParams.has(key),
    );

    if (!hasCheckoutParams) {
      return;
    }

    toast({
      title: paymentSuccessTitle,
      description: paymentSuccessDescription,
    });

    CREEM_CHECKOUT_QUERY_KEYS.forEach((key) => {
      url.searchParams.delete(key);
    });

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [cleanUrl, paymentSuccessDescription, paymentSuccessTitle, toast]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const mapped: WorkspaceSongItem[] = initialWorkspaceSongs.flatMap(
      (song) => {
        const status = normalizeStatus(song.status);

        if (!status) {
          return [];
        }

        return [
          {
            id: song.id,
            title: song.title,
            promptSummary: song.user_input,
            styleSummary: (song.style_tags ?? []).join(", "),
            status,
            isPublic: Boolean(song.is_public),
            coverUrl: song.cover_url,
            audioUrl: song.audio_url,
            versionTag: /\(Version B\)$/.test(song.title)
              ? t("versionB")
              : null,
            createdAt: song.created_at,
          },
        ];
      },
    );
    setWorkspaceSongs(mapped);
  }, [initialWorkspaceSongs, t]);

  useEffect(() => {
    if (!pendingInitialSongId) return;
    const exists = workspaceSongs.some(
      (song) => song.id === pendingInitialSongId,
    );
    if (exists) return;

    void (async () => {
      const response = await fetch(
        `/api/songs/${encodeURIComponent(pendingInitialSongId)}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as SongStatusPayload;
      if (data.status === "failed") {
        return;
      }
      setWorkspaceSongs((current) => [
        {
          id: data.songId,
          title: data.title,
          promptSummary: data.userInput,
          styleSummary: (data.styleTags ?? []).join(", "),
          status: data.status === "completed" ? "completed" : "processing",
          isPublic: true,
          coverUrl: data.coverUrl ?? null,
          audioUrl: data.audioUrl ?? null,
          versionTag: null,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    })();
  }, [pendingInitialSongId, workspaceSongs]);

  useEffect(() => {
    const processingSongs = workspaceSongs.filter(
      (song) => song.status === "processing",
    );
    if (processingSongs.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      processingSongs.forEach((song) => {
        void (async () => {
          if (pollInFlightRef.current[song.id]) {
            return;
          }

          const attempt = (pollAttemptsRef.current[song.id] ?? 0) + 1;
          pollAttemptsRef.current[song.id] = attempt;

          if (attempt > 60) {
            delete pollAttemptsRef.current[song.id];
            delete pollInFlightRef.current[song.id];
            setGenerationError(t("stillProcessingMessage"));
            setErrorAction("error");
            setWorkspaceSongs((current) =>
              current.filter((item) => item.id !== song.id),
            );
            return;
          }

          pollInFlightRef.current[song.id] = true;
          try {
            const response = await fetch(
              `/api/songs/${encodeURIComponent(song.id)}`,
              {
                cache: "no-store",
              },
            );
            if (!response.ok) return;
            const data = (await response.json()) as SongStatusPayload;
            if (data.status === "failed" || data.status === "completed") {
              delete pollAttemptsRef.current[song.id];
            }
            if (data.status === "failed") {
              setGenerationError(
                data.errorMessage ?? t("generationFailedWithRefundMessage"),
              );
              setErrorAction("error");
            }
            setWorkspaceSongs((current) =>
              data.status === "failed"
                ? current.filter((item) => item.id !== song.id)
                : current.map((item) =>
                    item.id !== song.id
                      ? item
                      : {
                          ...item,
                          status:
                            data.status === "completed"
                              ? "completed"
                              : "processing",
                          audioUrl: data.audioUrl ?? item.audioUrl,
                          coverUrl: data.coverUrl ?? item.coverUrl,
                        },
                  ),
            );
          } finally {
            delete pollInFlightRef.current[song.id];
          }
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

  useEffect(() => {
    return () => {
      playbackAudioRef.current?.pause();
      playbackAudioRef.current = null;
    };
  }, []);

  const filteredSongs = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return workspaceSongs
      .filter((song) => {
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
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || trimmedPrompt.length < 10) {
      toast({
        variant: "destructive",
        description: t("inputTooShort"),
      });
      return;
    }

    setIsSubmitting(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/songs/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt: mode === "text" ? trimmedPrompt : undefined,
          lyrics: mode === "lyrics" ? trimmedPrompt : undefined,
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
        id: data.songId,
        title: data.title || title.trim() || t("untitledSong"),
        promptSummary: trimmedPrompt,
        styleSummary: style,
        status: "processing",
        isPublic: true,
        coverUrl: null,
        audioUrl: null,
        versionTag: null,
        createdAt: new Date().toISOString(),
      };

      setWorkspaceSongs((current) => [
        optimistic,
        ...current.filter((song) => song.id !== optimistic.id),
      ]);
    } catch (caught) {
      setGenerationError(
        caught instanceof Error ? caught.message : t("generationFailed"),
      );
      setErrorAction("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!queuedDraft || isSubmitting) {
      return;
    }

    if (!queuedDraft.prompt?.trim()) {
      setQueuedDraft(null);
      return;
    }

    void submitGeneration().finally(() => {
      setQueuedDraft(null);
    });
  }, [isSubmitting, queuedDraft]);

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

  const switchModeRoute = (nextMode: "text" | "lyrics") => {
    if (nextMode === mode) {
      return;
    }

    if (!modeRoutes) {
      setMode(nextMode);
      return;
    }

    router.push(modeRoutes[nextMode]);
  };

  const toggleWorkspacePlayback = (song: WorkspaceSongItem) => {
    if (!song.audioUrl) {
      return;
    }

    const currentAudio = playbackAudioRef.current;
    if (playingSongId === song.id && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setPlayingSongId(null);
      return;
    }

    currentAudio?.pause();

    const nextAudio = new Audio(song.audioUrl);
    playbackAudioRef.current = nextAudio;
    setPlayingSongId(song.id);

    nextAudio.addEventListener(
      "ended",
      () => {
        if (playbackAudioRef.current === nextAudio) {
          setPlayingSongId(null);
        }
      },
      { once: true },
    );
    nextAudio.addEventListener(
      "error",
      () => {
        if (playbackAudioRef.current === nextAudio) {
          setPlayingSongId(null);
        }
      },
      { once: true },
    );

    void nextAudio.play().catch(() => {
      if (playbackAudioRef.current === nextAudio) {
        setPlayingSongId(null);
      }
    });
  };

  return (
    <>
      <ActionNeededDialog
        action={errorAction}
        localePrefix={localePrefix}
        errorMessage={generationError}
        onClose={() => {
          setErrorAction(null);
          setGenerationError(null);
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <aside className="rounded-xl border border-white/10 bg-card/90 p-5 shadow-sm shadow-black/20 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{t("generatorTitle")}</h1>
          </div>

          <div className="mb-4 inline-flex rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => switchModeRoute("text")}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === "text" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >
              {t("textToSong")}
            </button>
            <button
              type="button"
              onClick={() => switchModeRoute("lyrics")}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === "lyrics" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >
              {t("lyricsToSong")}
            </button>
          </div>

          <div className="mb-2">
            <p className="text-sm font-medium">
              {mode === "lyrics" ? t("lyricsLabel") : t("songIdea")}
            </p>
            {mode === "text" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("songIdeaHint")}
              </p>
            ) : null}
          </div>

          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              mode === "lyrics"
                ? t("lyricsPlaceholder")
                : t("songIdeaPlaceholder")
            }
            className="min-h-[180px] w-full resize-y text-sm"
          />

          <input
            value={style}
            onChange={(event) => setStyle(event.target.value)}
            placeholder={t("style")}
            className="mt-3 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => appendStyleTag(tag.value)}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs"
              >
                {t(tag.key)}
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("title")}
            className="mt-3 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
          />

          <Button
            type="button"
            size="lg"
            disabled={isSubmitting}
            onClick={submitGeneration}
            className="mt-5 w-full gap-2"
          >
            <Wand2
              className={`h-4 w-4 ${isSubmitting ? "animate-pulse" : ""}`}
            />
            {isSubmitting ? t("generating") : t("generateSong")}
          </Button>
        </aside>

        <section className="rounded-xl border border-white/10 bg-card p-5 shadow-sm shadow-black/20">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchSongs")}
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t("sortByNewest")}
              </span>
              {(["all", "public", "uploads"] as WorkspaceFilter[]).map(
                (item) => (
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
                      ? t("filters.all")
                      : item === "public"
                        ? t("filters.public")
                        : t("filters.uploads")}
                  </button>
                ),
              )}
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
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold">
                        {song.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          song.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {song.status === "completed"
                          ? t("status.completed")
                          : t("status.generating")}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {song.versionTag
                        ? t("versionDurationMeta", {
                            version: song.versionTag,
                            duration: formatDuration(
                              durations[song.id] ?? null,
                            ),
                          })
                        : t("durationMeta", {
                            duration: formatDuration(
                              durations[song.id] ?? null,
                            ),
                          })}
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
                    onClick={() => toggleWorkspacePlayback(song)}
                    aria-label={
                      playingSongId === song.id ? t("pauseSong") : t("playSong")
                    }
                  >
                    {playingSongId === song.id ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button asChild type="button" size="sm" variant="outline">
                    <Link href={`/report/${song.id}`}>{t("report")}</Link>
                  </Button>
                  {song.audioUrl && canDownload ? (
                    <SongDownloadButton
                      songId={song.id}
                      size="sm"
                      iconClassName="h-3.5 w-3.5"
                    />
                  ) : (
                    <SongDownloadButton
                      songId={song.id}
                      size="sm"
                      iconClassName="h-3.5 w-3.5"
                      disabled
                    />
                  )}
                </div>
              </article>
            ))}

            {filteredSongs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {t("noSongsFound")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
