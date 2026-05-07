import { StoryInput } from "@/components/create/story-input";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";

interface CreatePageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    id?: string;
    ref?: string;
    utm_campaign?: string;
  }>;
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

export default async function CreatePage({ params, searchParams }: CreatePageProps) {
  const { locale } = await params;
  const query = await searchParams;

  if (!locales.includes(locale)) {
    notFound();
  }

  const shouldResumeDraft = query.ref === "song" && Boolean(query.id);
  let initialDraft = null;

  if (shouldResumeDraft) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <StoryInput
        initialDraft={initialDraft}
        recallCampaign={query.utm_campaign ?? null}
      />
    </div>
  );
}
