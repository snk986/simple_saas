import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Clapperboard,
  Download,
  Flag,
  Gamepad2,
  Megaphone,
  Mic2,
  Podcast,
  Radio,
  ShieldCheck,
  Trophy,
  Video,
  Youtube,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
import { defaultLocale, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface WorldCupSongGeneratorPageProps {
  params: Promise<{ locale: Locale }>;
}

const pagePath = SEO_TOOL_PAGE_PATHS.worldCupSongGenerator;
const pageTitle =
  "World Cup Song Generator for Fan Chants & Soccer Videos | Calyra AI";
const pageDescription =
  "Create World Cup fan chants, country songs, soccer video music, and match-day tracks for YouTube, TikTok, podcasts, ads, and social media.";

const countryPrompts = [
  {
    country: "Brazil",
    vibe: "Samba drums, bright crowd vocals, and a joyful stadium hook.",
  },
  {
    country: "Argentina",
    vibe: "Passionate crowd chant, Latin pop pulse, and a triumphant chorus.",
  },
  {
    country: "Mexico",
    vibe: "Big horns, hand claps, and a bold sing-along match-day hook.",
  },
  {
    country: "Japan",
    vibe: "Fast J-pop rock energy, clean guitars, and a hopeful chant chorus.",
  },
  {
    country: "USA",
    vibe: "Stadium pop-rock drums, bold group vocals, and short-video energy.",
  },
  {
    country: "France",
    vibe: "Cinematic pop, stylish percussion, and a confident crowd refrain.",
  },
  {
    country: "Germany",
    vibe: "Driving drums, arena-rock guitars, and a precise chantable hook.",
  },
  {
    country: "Portugal",
    vibe: "Epic pop anthem energy, claps, and a soaring fan chorus.",
  },
  {
    country: "Spain",
    vibe: "Flamenco-pop rhythm, hand percussion, and a sunny chant hook.",
  },
  {
    country: "England",
    vibe: "Pub-chant energy, indie rock guitars, and a loud terrace chorus.",
  },
  {
    country: "Morocco",
    vibe: "North African percussion, cinematic tension, and proud crowd vocals.",
  },
  {
    country: "South Korea",
    vibe: "K-pop stadium energy, punchy drums, and a bright repeating hook.",
  },
];

const creatorUseCases = [
  {
    title: "Match previews",
    description: "Open YouTube previews with a custom country or matchup theme.",
    icon: Youtube,
  },
  {
    title: "Goal celebration videos",
    description: "Make short chant hooks for TikTok, Shorts, Reels, and edits.",
    icon: Clapperboard,
  },
  {
    title: "Podcast intros",
    description: "Create repeatable audio branding for daily match recaps.",
    icon: Podcast,
  },
  {
    title: "Watch party promos",
    description: "Make upbeat tracks for bars, communities, and social events.",
    icon: Megaphone,
  },
  {
    title: "Brand videos",
    description: "Create match-day music for ads and seasonal campaign clips.",
    icon: Video,
  },
  {
    title: "Game and stream content",
    description: "Score streams, fan reactions, and soccer gaming videos.",
    icon: Gamepad2,
  },
];

const upgradeReasons = [
  {
    title: "Generate more versions",
    description:
      "Try different countries, languages, moods, and chorus hooks for daily content.",
    icon: Zap,
  },
  {
    title: "Download tracks",
    description:
      "Export songs for editing, publishing, video intros, promos, and social clips.",
    icon: Download,
  },
  {
    title: "Use music commercially",
    description:
      "Use downloaded tracks in creator and commercial projects according to your plan and Calyra AI Terms.",
    icon: ShieldCheck,
  },
];

const faqs = [
  {
    question: "Can I make a World Cup fan song with AI?",
    answer:
      "Yes. You can use Calyra AI to create fan chants, country songs, hype tracks, and match-day music for creator content. Calyra AI is not affiliated with FIFA or any official tournament organization.",
  },
  {
    question: "Can I repeat a country name in the song?",
    answer:
      "Yes. You can ask Calyra AI to repeat a country name as a chant hook, chorus, or crowd response, while avoiding official team logos, protected marks, player names, or existing anthem melodies.",
  },
  {
    question: "Can I use the song for YouTube or TikTok?",
    answer:
      "You can create music for YouTube videos, TikTok edits, Shorts, Reels, podcasts, watch party promos, and social content according to your plan and Calyra AI Terms.",
  },
  {
    question: "Do I need a paid plan?",
    answer:
      "Free users can test song ideas. Paid plans are better for creators who need more generations, downloads, long-term use, and commercial use rights according to the selected plan.",
  },
];

function localeHref(locale: Locale, path: string) {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

function songMakerPrompt(country: string, vibe: string) {
  return [
    `Create an energetic soccer fan song for ${country} supporters.`,
    `Repeat "${country}" as a chant hook with stadium crowd energy.`,
    vibe,
    "Make it suitable for TikTok, YouTube Shorts, match previews, and fan videos.",
    "Do not reference official logos, player names, or existing tournament anthems.",
  ].join(" ");
}

function songMakerHref(locale: Locale, country: string, vibe: string) {
  const prompt = songMakerPrompt(country, vibe);
  const style =
    "Soccer fan chant, stadium drums, crowd vocals, energetic pop anthem, short-video hook";
  const title = `${country} Fan Song`;
  const params = new URLSearchParams({
    prompt,
    style,
    title,
    utm_campaign: "world_cup_song_generator",
  });

  return `${localeHref(locale, SEO_TOOL_PAGE_PATHS.aiSongMaker)}?${params.toString()}`;
}

export function generateStaticParams() {
  return [{ locale: defaultLocale }];
}

export async function generateMetadata({
  params,
}: WorldCupSongGeneratorPageProps): Promise<Metadata> {
  const { locale } = await params;
  const url = absoluteLocaleUrl(defaultLocale, pagePath);

  if (locale !== defaultLocale) {
    return {
      title: pageTitle,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildMarketingMetadata({
    title: pageTitle,
    description: pageDescription,
    url,
    locale: defaultLocale,
    alternates: {
      canonical: url,
    },
  });
}

export default async function WorldCupSongGeneratorPage({
  params,
}: WorldCupSongGeneratorPageProps) {
  const { locale } = await params;

  if (locale !== defaultLocale) {
    notFound();
  }

  const aiSongMakerHref = localeHref(locale, SEO_TOOL_PAGE_PATHS.aiSongMaker);
  const pricingHref = localeHref(locale, "/pricing");
  const termsHref = localeHref(locale, "/terms");
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="min-h-screen bg-[#050509] text-white">
        <section className="border-b border-white/10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),#050509] bg-[size:56px_56px]">
          <div className="container px-4 py-12 md:px-6 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-semibold uppercase tracking-normal text-emerald-200">
                  <Trophy className="h-4 w-4" />
                  World Cup season
                </p>
                <h1 className="mt-5 max-w-5xl text-4xl font-black leading-none tracking-normal md:text-6xl">
                  World Cup Song Generator for Fan Chants, Soccer Videos, and
                  Match-Day Content
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                  Create country fan songs, football chants, and short video
                  music for YouTube, TikTok, podcasts, watch parties, ads, and
                  social media. Free users can test ideas; paid plans unlock
                  more generation, downloads, and commercial use subject to
                  Calyra AI Terms.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="gap-2">
                    <Link href={aiSongMakerHref}>
                      Create a Fan Song
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href={pricingHref}>View Commercial Use Plans</Link>
                  </Button>
                </div>
                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Calyra AI is not affiliated with FIFA, any national team, or
                  any official tournament organization.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
                <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
                  Fast prompt ideas
                </p>
                <div className="mt-4 grid gap-3">
                  {[
                    "Epic stadium chant for a final match",
                    "Short goal celebration song for TikTok",
                    "Podcast intro for a daily match recap",
                    "Country fan anthem for YouTube Shorts",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
                Country fan songs
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
                Create a fan song for your country
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Choose a country to open AI Song Maker with a ready-to-edit
                prompt for a fan chant, hype song, or match-day video track.
              </p>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countryPrompts.map((item) => (
                <Link
                  key={item.country}
                  href={songMakerHref(locale, item.country, item.vibe)}
                  prefetch={false}
                  className="group rounded-lg border border-white/10 bg-white/[0.045] p-5 transition-colors hover:border-emerald-300/50 hover:bg-white/[0.075]"
                >
                  <Flag className="h-5 w-5 text-emerald-200" />
                  <h3 className="mt-4 text-lg font-semibold tracking-normal">
                    {item.country} Fan Song
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {item.vibe}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-200">
                    Use this prompt
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
                  Creator workflow
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
                  Built for creators who need more than one match-day song
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  Tournament content moves fast. Create music for match
                  previews, daily recaps, country reactions, podcast intros,
                  watch party promos, brand videos, and social ads without
                  starting from a blank studio session.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {creatorUseCases.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="rounded-lg border border-white/10 bg-white/[0.045] p-5"
                    >
                      <Icon className="h-5 w-5 text-emerald-200" />
                      <h3 className="mt-4 text-base font-semibold tracking-normal">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {item.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-[#0f1117] p-6 md:p-8">
              <BadgeCheck className="h-6 w-6 text-emerald-200" />
              <h2 className="mt-4 text-3xl font-bold tracking-normal md:text-4xl">
                Why creators upgrade during tournament season
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                One free test can be fun, but active creators often need more:
                multiple country versions, downloadable audio, and usage rights
                for videos, ads, podcasts, streams, and brand content.
              </p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {upgradeReasons.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="rounded-lg border border-white/10 bg-white/[0.045] p-5"
                    >
                      <Icon className="h-5 w-5 text-emerald-200" />
                      <h3 className="mt-4 font-semibold tracking-normal">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {item.description}
                      </p>
                    </article>
                  );
                })}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="gap-2">
                  <Link href={aiSongMakerHref}>
                    Create Match-Day Songs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href={pricingHref}>Compare Plans</Link>
                </Button>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">
                Commercial use and downloads depend on your selected plan and
                the latest{" "}
                <Link href={termsHref} className="text-emerald-200 underline">
                  Calyra AI Terms
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl">
              <div className="flex items-center gap-3">
                <Radio className="h-6 w-6 text-emerald-200" />
                <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
                  World Cup Song Generator FAQ
                </h2>
              </div>
              <div className="mt-6 grid gap-3">
                {faqs.map((item, index) => (
                  <details
                    key={item.question}
                    open={index === 0}
                    className="rounded-lg border border-white/10 bg-white/[0.045] p-5"
                  >
                    <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
                      {item.question}
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-12 md:py-16">
          <div className="container px-4 text-center md:px-6">
            <Mic2 className="mx-auto h-8 w-8 text-emerald-200" />
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-normal md:text-4xl">
              Make a country fan song for your next soccer video
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Start with a country, a chant hook, and a match-day mood. Calyra
              AI turns the idea into a song direction you can generate and
              refine.
            </p>
            <Button asChild size="lg" className="mt-8 gap-2">
              <Link href={aiSongMakerHref}>
                Start with AI Song Maker
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
