import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { StoryInput } from "@/components/create/story-input";
import { SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { createClient } from "@/utils/supabase/server";

export type SongMakerRouteKey =
  | "aiSongMaker"
  | "aiTextToSong"
  | "aiLyricsToSong";

type SongMakerMode = "text" | "lyrics";

type SongMakerSearchParams = {
  id?: string;
  ref?: string;
  utm_campaign?: string;
  upgraded?: string;
  prompt?: string;
  style?: string;
  title?: string;
  jobId?: string;
};

interface SongMakerRoutePageProps {
  locale: Locale;
  routeKey: SongMakerRouteKey;
  initialMode: SongMakerMode;
  searchParams: SongMakerSearchParams;
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
  routePath: string,
  searchParams: SongMakerSearchParams,
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return `${localePrefix(locale)}${routePath}${query ? `?${query}` : ""}`;
}

export async function buildSongMakerMetadata({
  locale,
  routeKey,
}: {
  locale: Locale;
  routeKey: SongMakerRouteKey;
}): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: `seoPages.${routeKey}.seo`,
  });
  const pagePath = SEO_TOOL_PAGE_PATHS[routeKey];
  const url = absoluteLocaleUrl(locale, pagePath);

  return buildMarketingMetadata({
    title: t("title"),
    description: t("description"),
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates(pagePath),
    },
  });
}

export async function SongMakerRoutePage({
  locale,
  routeKey,
  initialMode,
  searchParams,
}: SongMakerRoutePageProps) {
  if (!locales.includes(locale)) {
    notFound();
  }

  const routePath = SEO_TOOL_PAGE_PATHS[routeKey];
  const t = await getTranslations(`seoPages.${routeKey}`);
  const tCreate = await getTranslations("create");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const entitlements = user ? await getUserEntitlements(user.id) : null;
  const canDownload = entitlements ? entitlements.plan !== "free" : false;
  const shouldResumeDraft =
    searchParams.ref === "song" && Boolean(searchParams.id);
  let initialDraft = null;
  let initialWorkspaceSongs: InitialWorkspaceSong[] = [];

  if (shouldResumeDraft) {
    if (!user) {
      const redirectTo = buildRedirectPath(locale, routePath, searchParams);
      redirect(
        `${localePrefix(locale)}/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`,
      );
    }

    const { data: song, error } = await supabase
      .from("songs")
      .select(
        "id,title,lyrics,user_input,style_key,style_params,style_tags,lyrics_regen_count,status,audio_url,user_id",
      )
      .eq("id", searchParams.id)
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

  const faqKeys = ["one", "two", "three", "four"] as const;
  const faqs = faqKeys.map((key) => ({
    question: t(`faq.${key}.question`),
    answer: t(`faq.${key}.answer`),
  }));
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t("hero.title"),
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: absoluteLocaleUrl(locale, routePath),
    description: t("seo.description"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container px-4 py-8 md:px-6 md:py-12">
        <section className="mx-auto mb-8 max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-normal md:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {t("hero.description")}
          </p>
        </section>

        {searchParams.upgraded === "true" && (
          <div className="mx-auto mb-6 max-w-3xl rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            <p className="font-medium">{tCreate("paymentSuccessTitle")}</p>
            <p className="mt-1 text-muted-foreground">
              {tCreate("paymentSuccessDescription")}
            </p>
          </div>
        )}

        <StoryInput
          initialDraft={initialDraft}
          recallCampaign={searchParams.utm_campaign ?? null}
          canDownload={canDownload}
          creditsBalance={entitlements?.creditsBalance ?? 0}
          initialPrompt={searchParams.prompt ?? null}
          initialStyle={searchParams.style ?? null}
          initialTitle={searchParams.title ?? null}
          initialMode={initialMode}
          initialJobId={searchParams.jobId ?? null}
          initialWorkspaceSongs={initialWorkspaceSongs}
          modeRoutes={{
            text: `${localePrefix(locale)}${SEO_TOOL_PAGE_PATHS.aiTextToSong}`,
            lyrics: `${localePrefix(locale)}${SEO_TOOL_PAGE_PATHS.aiLyricsToSong}`,
          }}
        />

        <section className="mx-auto mt-12 max-w-4xl">
          <h2 className="text-3xl font-bold tracking-normal">
            {t("faq.title")}
          </h2>
          <div className="mt-6 grid gap-3">
            {faqs.map((item, index) => (
              <details
                key={item.question}
                open={index === 0}
                className="rounded-lg border bg-card p-5"
              >
                <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
