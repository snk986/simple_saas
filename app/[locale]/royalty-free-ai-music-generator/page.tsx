import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Clapperboard,
  Gamepad2,
  Headphones,
  Megaphone,
  Mic2,
  Music2,
  Podcast,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface RoyaltyFreeAiMusicGeneratorPageProps {
  params: Promise<{ locale: Locale }>;
}

const pagePath = SEO_TOOL_PAGE_PATHS.royaltyFreeAiMusicGenerator;
const pageTitle =
  "Royalty-Free AI Music Generator for Videos & Creators | Calyra AI";
const pageDescription =
  "Create royalty-free AI music for YouTube, TikTok, podcasts, games, ads, and social media. Generate songs with vocals or instrumentals for creator and commercial projects.";

const heroUseCases = [
  { title: "YouTube Videos", icon: Video },
  { title: "TikTok & Shorts", icon: Clapperboard },
  { title: "Podcasts", icon: Podcast },
  { title: "Games", icon: Gamepad2 },
  { title: "Ads & Brand Videos", icon: Megaphone },
  { title: "Social Media Content", icon: Sparkles },
];

const useCases = [
  {
    title: "YouTube Videos",
    description: "Background music, intro tracks, outro music, and creator videos.",
    icon: Video,
  },
  {
    title: "TikTok & Shorts",
    description: "Short-form music ideas for social videos, edits, and reels.",
    icon: Clapperboard,
  },
  {
    title: "Podcasts",
    description: "Intro music, transitions, and branded audio for episodes.",
    icon: Podcast,
  },
  {
    title: "Games",
    description: "Background music for indie games, trailers, and demos.",
    icon: Gamepad2,
  },
  {
    title: "Ads & Brand Videos",
    description: "Music for product videos, social ads, and landing page videos.",
    icon: Megaphone,
  },
  {
    title: "Social Media Content",
    description: "Music for Instagram, Reels, creator posts, and lifestyle content.",
    icon: Music2,
  },
];

const toolCards = [
  {
    title: "AI Song Maker",
    description:
      "For creating a complete AI-generated song from a simple prompt or idea.",
    href: SEO_TOOL_PAGE_PATHS.aiSongMaker,
    icon: Sparkles,
  },
  {
    title: "Text to Song",
    description:
      "For turning a short idea, mood, scene, or concept into music.",
    href: SEO_TOOL_PAGE_PATHS.aiTextToSong,
    icon: Mic2,
  },
  {
    title: "Lyrics to Song",
    description:
      "For turning existing lyrics into a complete AI-generated song.",
    href: SEO_TOOL_PAGE_PATHS.aiLyricsToSong,
    icon: Headphones,
  },
];

const faqs = [
  {
    question: "Is AI-generated music from Calyra AI royalty-free?",
    answer:
      "Calyra AI lets users generate music for creator and commercial projects according to their plan and our terms. Royalty-free generally means you do not need to pay extra royalties every time the track is used, but your use should always follow the license and terms that apply to your account.",
  },
  {
    question: "Can I use Calyra AI music on YouTube?",
    answer:
      "Yes, you can create AI music for YouTube videos, intros, outros, background music, and creator content according to your plan and our terms.",
  },
  {
    question: "Can I use the music for TikTok, Instagram, and Shorts?",
    answer:
      "Yes. You can generate short-form music ideas for TikTok, Instagram Reels, YouTube Shorts, and social media content.",
  },
  {
    question: "Can I generate instrumental royalty-free music?",
    answer:
      "Yes. Calyra AI supports both vocal songs and instrumental music, so you can create background tracks for videos, podcasts, games, ads, and other projects.",
  },
  {
    question: "Is royalty-free the same as copyright-free?",
    answer:
      "No. Royalty-free usually means you do not need to pay extra royalties for each use under the license terms. It does not always mean there is no copyright or no usage rules.",
  },
  {
    question: "Do I need music skills to use Calyra AI?",
    answer:
      "No. You can describe your idea in simple words, choose a style, and let Calyra AI generate the song.",
  },
];

function localeHref(locale: Locale, path: string) {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: RoyaltyFreeAiMusicGeneratorPageProps): Promise<Metadata> {
  const { locale } = await params;
  const url = absoluteLocaleUrl(locale, pagePath);

  return buildMarketingMetadata({
    title: pageTitle,
    description: pageDescription,
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates(pagePath),
    },
  });
}

export default async function RoyaltyFreeAiMusicGeneratorPage({
  params,
}: RoyaltyFreeAiMusicGeneratorPageProps) {
  const { locale } = await params;
  const songMakerHref = localeHref(locale, SEO_TOOL_PAGE_PATHS.aiSongMaker);
  const textToSongHref = localeHref(locale, SEO_TOOL_PAGE_PATHS.aiTextToSong);
  const lyricsToSongHref = localeHref(locale, SEO_TOOL_PAGE_PATHS.aiLyricsToSong);
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

  const toolHrefs = [songMakerHref, textToSongHref, lyricsToSongHref];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="min-h-screen bg-[#07080b] text-white">
        <section className="border-b border-white/10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),#07080b] bg-[size:56px_56px]">
          <div className="container px-4 py-12 md:px-6 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Commercial-use guide
                </p>
                <h1 className="mt-4 max-w-5xl text-4xl font-black leading-none tracking-normal md:text-6xl">
                  Royalty-Free AI Music Generator for Videos, Podcasts, Games,
                  and Ads
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                  Need music you can use in creator or commercial projects?
                  Calyra AI helps you create AI-generated songs and
                  instrumentals for YouTube, TikTok, podcasts, games, ads, and
                  social media - according to your plan and our terms.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="gap-2">
                    <Link href={songMakerHref}>
                      Start Creating Royalty-Free AI Music
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
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {heroUseCases.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-lg border border-white/10 bg-white/[0.045] p-4"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold">
                        {item.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-12 md:py-16">
          <div className="container grid gap-6 px-4 md:px-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Creator-ready context
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
                Music for creators who need usable tracks
              </h2>
            </div>
            <div className="space-y-4 text-base leading-8 text-slate-300">
              <p>
                When creators search for royalty-free AI music, they are
                usually not just looking for a music generator. They want to
                know if the music can be used in real projects like videos,
                ads, podcasts, games, and social media content.
              </p>
              <p>
                Calyra AI is designed to help creators turn simple music ideas,
                lyrics, or style directions into AI-generated songs and
                instrumentals that can support real content projects.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
                Where you can use AI-generated music
              </h2>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {useCases.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-lg border border-white/10 bg-white/[0.045] p-6"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold tracking-normal">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] py-12 md:py-16">
          <div className="container grid gap-6 px-4 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
              <BadgeCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
                What does royalty-free mean?
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Royalty-free does not always mean free to download or free from
                all rules. It usually means you do not need to pay extra
                royalties every time the music is played, published, or used,
                as long as your use follows the license or terms that apply.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-300">
                With Calyra AI, commercial use should follow the user's{" "}
                <Link href={pricingHref} className="text-primary underline">
                  plans
                </Link>{" "}
                and Calyra AI{" "}
                <Link href={termsHref} className="text-primary underline">
                  terms
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
                How Calyra AI helps
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Calyra AI helps you turn a simple idea, lyrics, or music style
                into a complete AI-generated song or instrumental track. This
                page is a use-case guide; actual music creation happens in the
                existing Calyra AI tools.
              </p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {toolCards.map((item, index) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={toolHrefs[index]}
                    className="rounded-lg border border-white/10 bg-white/[0.045] p-6 transition-colors hover:border-primary/50 hover:bg-white/[0.07]"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold tracking-normal">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Open tool
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl rounded-lg border border-white/10 bg-[#0f1117] p-6 md:p-8">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-3xl font-bold tracking-normal md:text-4xl">
                Before using AI music commercially
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                For commercial use, always check your plan, usage rights, and
                platform terms. Calyra AI is designed for creator projects, but
                users should avoid assuming that any AI-generated track is
                guaranteed to be copyright-free or risk-free in every
                situation.
              </p>
              <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
                <h3 className="text-lg font-semibold tracking-normal">
                  Commercial use with paid plans
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Paid users can use downloaded Calyra AI tracks in creator and
                  commercial projects such as YouTube videos, TikTok content,
                  podcasts, social media posts, ads, games, and brand videos,
                  subject to Calyra AI Terms.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Free users can test song ideas, but commercial use and
                  long-term downloads may depend on the selected plan.
                </p>
              </div>
              <Button asChild className="mt-6">
                <Link href={termsHref}>Read Terms</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
                Royalty-Free AI Music FAQ
              </h2>
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
            <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-normal md:text-4xl">
              Make AI music for your next creator project
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Create songs or instrumentals for videos, podcasts, games, ads,
              and social media with Calyra AI.
            </p>
            <Button asChild size="lg" className="mt-8 gap-2">
              <Link href={songMakerHref}>
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
