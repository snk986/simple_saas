import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  BadgeDollarSign,
  FileText,
  Gamepad2,
  Mic2,
  Radio,
  SlidersHorizontal,
  Type,
  Youtube,
  Zap,
} from "lucide-react";
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
  utm_campaign?: string;
  upgraded?: string;
  prompt?: string;
  style?: string;
  title?: string;
};

interface SongMakerRoutePageProps {
  locale: Locale;
  routeKey: SongMakerRouteKey;
  initialMode: SongMakerMode;
  searchParams: SongMakerSearchParams;
  cleanUrl?: boolean;
}

interface InitialWorkspaceSong {
  id: string;
  title: string;
  user_input: string;
  style_tags: string[] | null;
  status: "generating" | "ready" | "failed" | "expired";
  is_public: boolean;
  cover_url: string | null;
  audio_url: string | null;
  created_at: string;
}

type AiSongMakerSectionContent = {
  eyebrow: string;
  title: string;
  description: string;
  items: Record<string, { title: string; description: string }>;
  link: {
    href: string;
    label: string;
  };
};

const howItWorksKeys = ["prompt", "style", "generate"] as const;
const useCaseKeys = [
  "youtube",
  "tiktok",
  "podcast",
  "games",
  "ads",
  "social",
] as const;
const whyChooseKeys = ["modes", "controls", "license"] as const;

const useCaseIcons = {
  youtube: Youtube,
  tiktok: Zap,
  podcast: Mic2,
  games: Gamepad2,
  ads: BadgeDollarSign,
  social: Radio,
} as const;

const whyChooseIcons = {
  modes: Type,
  controls: SlidersHorizontal,
  license: FileText,
} as const;

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
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
  cleanUrl = false,
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
  let initialWorkspaceSongs: InitialWorkspaceSong[] = [];

  if (user) {
    const { data: songs } = await supabase
      .from("songs")
      .select(
        "id,title,user_input,style_tags,status,is_public,cover_url,audio_url,created_at",
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
  const aiSongMakerSections =
    routeKey === "aiSongMaker"
      ? {
          howItWorks: {
            eyebrow: t("howItWorks.eyebrow"),
            title: t("howItWorks.title"),
            description: t("howItWorks.description"),
            link: {
              href: localePrefix(locale) || "/",
              label: "explore all tools",
            },
            items: {
              prompt: {
                title: t("howItWorks.items.prompt.title"),
                description: t("howItWorks.items.prompt.description"),
              },
              style: {
                title: t("howItWorks.items.style.title"),
                description: t("howItWorks.items.style.description"),
              },
              generate: {
                title: t("howItWorks.items.generate.title"),
                description: t("howItWorks.items.generate.description"),
              },
            },
          },
          useCases: {
            eyebrow: t("useCases.eyebrow"),
            title: t("useCases.title"),
            description: t("useCases.description"),
            link: {
              href: `${localePrefix(locale)}/pricing`,
              label: "view pricing",
            },
            items: {
              youtube: {
                title: t("useCases.items.youtube.title"),
                description: t("useCases.items.youtube.description"),
              },
              tiktok: {
                title: t("useCases.items.tiktok.title"),
                description: t("useCases.items.tiktok.description"),
              },
              podcast: {
                title: t("useCases.items.podcast.title"),
                description: t("useCases.items.podcast.description"),
              },
              games: {
                title: t("useCases.items.games.title"),
                description: t("useCases.items.games.description"),
              },
              ads: {
                title: t("useCases.items.ads.title"),
                description: t("useCases.items.ads.description"),
              },
              social: {
                title: t("useCases.items.social.title"),
                description: t("useCases.items.social.description"),
              },
            },
          },
          whyChoose: {
            eyebrow: t("whyChoose.eyebrow"),
            title: t("whyChoose.title"),
            description: t("whyChoose.description"),
            link: {
              href: `${localePrefix(locale)}/about`,
              label: "learn more",
            },
            items: {
              modes: {
                title: t("whyChoose.items.modes.title"),
                description: t("whyChoose.items.modes.description"),
              },
              controls: {
                title: t("whyChoose.items.controls.title"),
                description: t("whyChoose.items.controls.description"),
              },
              license: {
                title: t("whyChoose.items.license.title"),
                description: t("whyChoose.items.license.description"),
              },
            },
          },
        }
      : null;
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
  const howToJsonLd =
    routeKey === "aiSongMaker"
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Use AI Song Maker",
          description:
            "Complete step-by-step guide to creating original songs with AI. Generate music from text prompts or your own lyrics in under 2 minutes. Perfect for content creators, musicians, and anyone who wants to make music without production experience.",
          totalTime: "PT2M",
          estimatedCost: {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: "0",
          },
          supply: [
            {
              "@type": "HowToSupply",
              name: "Free Calyra AI account",
            },
          ],
          tool: [
            {
              "@type": "HowToTool",
              name: "Web browser",
            },
          ],
          step: [
            {
              "@type": "HowToStep",
              name: "Choose your input mode",
              text: "Start by selecting your creation method on the AI Song Maker page. Choose 'Text to Song' to generate both lyrics and music from a description, story, or mood. This mode is ideal if you want AI to handle the complete creative process. Select 'Lyrics to Song' if you already have written lyrics and want to transform them into a full song with vocals, melody, and instrumentation. Both modes produce broadcast-quality results.",
              url: absoluteLocaleUrl(locale, routePath),
            },
            {
              "@type": "HowToStep",
              name: "Write your prompt or paste lyrics",
              text: "For Text to Song, describe your musical vision in detail. Include the emotional tone (uplifting, melancholic, energetic), the theme or story (road trip, lost love, victory), and the intended use case (YouTube intro, podcast theme, personal gift). For Lyrics to Song, paste your complete lyrics in the input field. Add context about the song's mood and genre to help the AI choose appropriate musical arrangements and vocal delivery.",
              url: absoluteLocaleUrl(locale, routePath),
            },
            {
              "@type": "HowToStep",
              name: "Add style direction",
              text: "Customize your song's musical style with precision. Select the genre (pop, rock, hip-hop, electronic, folk, jazz), specify instrumentation preferences (acoustic guitar, synth pads, orchestral strings, drum machine), set the tempo (fast-paced, moderate, slow ballad), and choose vocal characteristics (male/female voice, energetic/soft delivery, harmonies). You can also reference specific artists or songs as style inspiration to guide the AI's creative direction.",
              url: absoluteLocaleUrl(locale, routePath),
            },
            {
              "@type": "HowToStep",
              name: "Generate and download",
              text: "Click the generate button to start the AI music creation process. The system typically takes 60-90 seconds to compose and produce your complete song with vocals, instruments, mixing, and mastering. Preview the result directly in your browser to evaluate the quality. Paid plan users can download the song in MP3 (standard quality) or WAV (high quality) format for commercial use in videos, podcasts, or streaming platforms. Free users can generate up to 3 songs per day.",
              url: absoluteLocaleUrl(locale, routePath),
            },
          ],
        }
      : null;

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
      {howToJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      ) : null}
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
          recallCampaign={cleanUrl ? null : (searchParams.utm_campaign ?? null)}
          canDownload={canDownload}
          initialPrompt={cleanUrl ? null : (searchParams.prompt ?? null)}
          initialStyle={cleanUrl ? null : (searchParams.style ?? null)}
          initialTitle={cleanUrl ? null : (searchParams.title ?? null)}
          initialMode={initialMode}
          cleanUrl={cleanUrl}
          paymentSuccessTitle={tCreate("paymentSuccessTitle")}
          paymentSuccessDescription={tCreate("paymentSuccessDescription")}
          initialWorkspaceSongs={initialWorkspaceSongs}
          modeRoutes={{
            text: `${localePrefix(locale)}${SEO_TOOL_PAGE_PATHS.aiTextToSong}`,
            lyrics: `${localePrefix(locale)}${SEO_TOOL_PAGE_PATHS.aiLyricsToSong}`,
          }}
        />

        {aiSongMakerSections ? (
          <div className="mt-12 md:mt-16">
            <AiSongMakerMarketingContent sections={aiSongMakerSections} />
          </div>
        ) : null}

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

function AiSongMakerMarketingContent({
  sections,
}: {
  sections: {
    howItWorks: AiSongMakerSectionContent;
    useCases: AiSongMakerSectionContent;
    whyChoose: AiSongMakerSectionContent;
  };
}) {
  const { howItWorks, useCases, whyChoose } = sections;

  return (
    <div className="mx-auto mb-10 max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#050509] text-white shadow-[0_34px_120px_rgba(0,0,0,0.34)] md:rounded-[36px]">
      <MarketingSection
        eyebrow={howItWorks.eyebrow}
        title={howItWorks.title}
        description={howItWorks.description}
        link={howItWorks.link}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {howItWorksKeys.map((key, index) => {
            const item = howItWorks.items[key];

            return (
              <article
                key={item.title}
                className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgba(139,92,246,0.2),transparent_36%),rgba(255,255,255,0.055)] p-6"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-base font-black text-black">
                  {index + 1}
                </div>
                <h3 className="text-xl font-black tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-400">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow={useCases.eyebrow}
        title={useCases.title}
        description={useCases.description}
        link={useCases.link}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCaseKeys.map((key) => {
            const item = useCases.items[key];
            const Icon = useCaseIcons[key];

            return (
              <article
                key={item.title}
                className="group min-h-40 rounded-[26px] border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.085]"
              >
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow={whyChoose.eyebrow}
        title={whyChoose.title}
        description={whyChoose.description}
        link={whyChoose.link}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {whyChooseKeys.map((key) => {
            const item = whyChoose.items[key];
            const Icon = whyChooseIcons[key];

            return (
              <article
                key={item.title}
                className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_92%_12%,rgba(219,39,119,0.16),transparent_32%),rgba(255,255,255,0.055)] p-6"
              >
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.09] text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-400">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </MarketingSection>
    </div>
  );
}

function MarketingSection({
  eyebrow,
  title,
  description,
  link,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  link: {
    href: string;
    label: string;
  };
  children: React.ReactNode;
}) {
  return (
    <section className="py-12 first:pt-10 md:py-14">
      <div className="px-4 md:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase text-violet-300">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 leading-8 text-slate-400">
            {description}{" "}
            <Link href={link.href} className="text-primary hover:underline">
              {link.label}
            </Link>
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
