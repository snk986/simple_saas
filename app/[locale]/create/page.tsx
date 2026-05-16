import { StoryInput } from "@/components/create/story-input";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

interface CreatePageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    id?: string;
    ref?: string;
    utm_campaign?: string;
    upgraded?: string;
    mode?: string;
    prompt?: string;
    style?: string;
    title?: string;
    jobId?: string;
  }>;
}

interface InitialWorkspaceSong {
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
}

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

function buildRedirectPath(
  locale: Locale,
  searchParams: Awaited<CreatePageProps["searchParams"]>,
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return `${localePrefix(locale)}/create${query ? `?${query}` : ""}`;
}

export default async function CreatePage({
  params,
  searchParams,
}: CreatePageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations("create");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const entitlements = user ? await getUserEntitlements(user.id) : null;
  const canDownload = entitlements ? entitlements.plan !== "free" : false;

  if (!locales.includes(locale)) {
    notFound();
  }

  const shouldResumeDraft = query.ref === "song" && Boolean(query.id);
  let initialDraft = null;
  let initialWorkspaceSongs: InitialWorkspaceSong[] = [];

  if (shouldResumeDraft) {
    if (!user) {
      const redirectTo = buildRedirectPath(locale, query);
      redirect(
        `${localePrefix(locale)}/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`,
      );
    }

    const { data: song, error } = await supabase
      .from("songs")
      .select(
        "id,title,lyrics,user_input,style_key,style_params,style_tags,lyrics_regen_count,status,audio_url,user_id",
      )
      .eq("id", query.id)
      .eq("user_id", user.id)
      .single();

    if (error || !song) {
      notFound();
    }

    initialDraft = {
      songId: song.id,
      title: song.title,
      lyrics: song.lyrics,
      userInput: song.user_input,
      style_key: song.style_key,
      style_params: song.style_params,
      style_tags: song.style_tags ?? [],
      lyrics_regen_count: song.lyrics_regen_count ?? 0,
    };
  }

  if (user) {
    const { data: songs } = await supabase
      .from("songs")
      .select(
        "id,title,user_input,style_tags,status,is_public,cover_url,audio_url,created_at,audio_provider,audio_provider_task_id,like_count",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    initialWorkspaceSongs = (songs ?? []) as InitialWorkspaceSong[];
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      {query.upgraded === "true" && (
        <div className="mx-auto mb-6 max-w-3xl rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <p className="font-medium">{t("paymentSuccessTitle")}</p>
          <p className="mt-1 text-muted-foreground">
            {t("paymentSuccessDescription")}
          </p>
        </div>
      )}
      <StoryInput
        initialDraft={initialDraft}
        recallCampaign={query.utm_campaign ?? null}
        canDownload={canDownload}
        creditsBalance={entitlements?.creditsBalance ?? 0}
        initialPrompt={query.prompt ?? null}
        initialStyle={query.style ?? null}
        initialTitle={query.title ?? null}
        initialMode={query.mode === "lyrics" ? "lyrics" : "text"}
        initialJobId={query.jobId ?? null}
        initialWorkspaceSongs={initialWorkspaceSongs}
      />
    </div>
  );
}
