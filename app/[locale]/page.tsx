import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  CirclePlay,
  Coffee,
  FileText,
  Gamepad2,
  Headphones,
  HelpCircle,
  Mic2,
  Music2,
  PenLine,
  Play,
  Radio,
  Sparkles,
  Star,
  Youtube,
  Zap,
} from "lucide-react";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { locales, type Locale } from "@/i18n/routing";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

type GallerySong = {
  key: string;
  title: string;
  author: string;
  plays: string;
  rating: string;
  cover: string;
  avatar: string;
};

const gallerySongs: GallerySong[] = [
  {
    key: "holy-spirit",
    title: "The Holy Spirit",
    author: "DJ Soul",
    plays: "334.8K",
    rating: "4.8",
    cover: "linear-gradient(135deg, #20162f 0%, #ef4444 52%, #38bdf8 100%)",
    avatar: "linear-gradient(135deg, #ef4444, #38bdf8)",
  },
  {
    key: "midnight-palm",
    title: "Midnight Palm",
    author: "Linda Skratch",
    plays: "345.2K",
    rating: "4.6",
    cover: "linear-gradient(135deg, #061628 0%, #0ea5e9 52%, #facc15 100%)",
    avatar: "linear-gradient(135deg, #0ea5e9, #facc15)",
  },
  {
    key: "cerros",
    title: "Cerros",
    author: "Luna Jazz",
    plays: "156.2K",
    rating: "4.5",
    cover: "linear-gradient(135deg, #e5e7eb 0%, #60a5fa 52%, #0f172a 100%)",
    avatar: "linear-gradient(135deg, #60a5fa, #0f172a)",
  },
  {
    key: "christmas-gift",
    title: "Christmas Gift",
    author: "Miss Delight",
    plays: "210.3K",
    rating: "4.9",
    cover: "linear-gradient(135deg, #431407 0%, #dc2626 52%, #f59e0b 100%)",
    avatar: "linear-gradient(135deg, #dc2626, #f59e0b)",
  },
  {
    key: "lost-now",
    title: "Lost in the Now",
    author: "Beat Master",
    plays: "328.1K",
    rating: "4.7",
    cover: "linear-gradient(135deg, #050505 0%, #737373 52%, #f8fafc 100%)",
    avatar: "linear-gradient(135deg, #737373, #f8fafc)",
  },
  {
    key: "neon-heartbreak",
    title: "Neon Heartbreak",
    author: "Sophia Grace",
    plays: "275.7K",
    rating: "4.6",
    cover: "linear-gradient(135deg, #1e1b4b 0%, #7c3aed 52%, #ec4899 100%)",
    avatar: "linear-gradient(135deg, #7c3aed, #ec4899)",
  },
  {
    key: "ton-pere",
    title: "Ton PERE",
    author: "Pierre Dubois",
    plays: "198.4K",
    rating: "4.3",
    cover: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 52%, #111827 100%)",
    avatar: "linear-gradient(135deg, #1d4ed8, #111827)",
  },
  {
    key: "dust-horizon",
    title: "Dust on Horizon",
    author: "Will Harper",
    plays: "129.6K",
    rating: "4.4",
    cover: "linear-gradient(135deg, #052e16 0%, #0e7490 52%, #fde68a 100%)",
    avatar: "linear-gradient(135deg, #0e7490, #fde68a)",
  },
];

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.seo" });
  const url = absoluteLocaleUrl(locale);

  return buildMarketingMetadata({
    title: t("title"),
    description: t("description"),
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates(),
    },
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");

  const styleCards = [
    {
      icon: Mic2,
      title: t("styles.rap.title"),
      description: t("styles.rap.description"),
    },
    {
      icon: Sparkles,
      title: t("styles.songMaker.title"),
      description: t("styles.songMaker.description"),
    },
    {
      icon: PenLine,
      title: t("styles.lyrics.title"),
      description: t("styles.lyrics.description"),
    },
    {
      icon: FileText,
      title: t("styles.text.title"),
      description: t("styles.text.description"),
    },
    {
      icon: Car,
      title: t("styles.phonk.title"),
      description: t("styles.phonk.description"),
    },
    {
      icon: Coffee,
      title: t("styles.lofi.title"),
      description: t("styles.lofi.description"),
    },
    {
      icon: Zap,
      title: t("styles.edm.title"),
      description: t("styles.edm.description"),
    },
    {
      icon: Star,
      title: t("styles.anime.title"),
      description: t("styles.anime.description"),
    },
  ];

  const templates = ["genre", "lyrics", "useCase"].map((key) => ({
    type: t(`templates.items.${key}.type`),
    title: t(`templates.items.${key}.title`),
    description: t(`templates.items.${key}.description`),
    prompt: t(`templates.items.${key}.prompt`),
  }));

  const useCases = [
    { icon: Youtube, label: t("commercial.uses.youtube") },
    { icon: Play, label: t("commercial.uses.tiktok") },
    { icon: Headphones, label: t("commercial.uses.podcast") },
    { icon: Gamepad2, label: t("commercial.uses.games") },
    { icon: Radio, label: t("commercial.uses.ads") },
    { icon: Music2, label: t("commercial.uses.social") },
  ];

  const steps = ["idea", "generate", "download"].map((key, index) => ({
    number: index + 1,
    title: t(`steps.${key}.title`),
    description: t(`steps.${key}.description`),
  }));

  const benefits = [
    "skills",
    "vocals",
    "prompts",
    "creators",
    "genres",
    "publish",
  ].map((key) => ({
    title: t(`benefits.items.${key}.title`),
    description: t(`benefits.items.${key}.description`),
  }));

  const priceCards = ["free", "basic", "pro"].map((key) => ({
    title: t(`pricingPreview.plans.${key}.title`),
    description: t(`pricingPreview.plans.${key}.description`),
  }));

  const faqItems = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"].map((key) => ({
    question: t(`faq.${key}`),
    answer: t(`faq.${key.replace("q", "a")}`),
  }));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Calyra AI",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: absoluteLocaleUrl(locale),
    description: t("seo.description"),
    offers: {
      "@type": "Offer",
      category: "AI music creation",
      price: "0",
      priceCurrency: "USD",
    },
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#050509] text-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section
        id="generate"
        className="relative border-b border-white/10 bg-[radial-gradient(circle_at_18%_-4%,rgba(139,92,246,0.26),transparent_34%),radial-gradient(circle_at_82%_4%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_50%_42%,rgba(219,39,119,0.09),transparent_31%),linear-gradient(180deg,#07070b_0%,#050509_46%,#030306_100%)] py-12 md:py-20"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.65),transparent_70%)]" />
        <div className="container relative grid gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200 shadow-2xl shadow-black/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
              {t("eyebrow")}
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-none tracking-normal text-white md:text-7xl lg:text-8xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 grid max-w-3xl gap-3 rounded-[28px] border border-white/20 bg-white/[0.07] p-2 shadow-[0_34px_120px_rgba(0,0,0,0.52)] backdrop-blur sm:grid-cols-[1fr_auto]">
              <input
                aria-label={t("hero.promptLabel")}
                className="min-h-14 rounded-2xl bg-transparent px-4 text-sm text-white outline-none placeholder:text-slate-500"
                placeholder={t("hero.placeholder")}
              />
              <Button
                asChild
                size="lg"
                className="h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 px-6 text-base font-black text-white shadow-[0_22px_56px_rgba(139,92,246,0.25)] hover:brightness-110"
              >
                <Link href="/create">
                  {t("hero.primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-2xl border-white/15 bg-white/[0.06] px-5 font-bold text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#gallery">{t("hero.galleryCta")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-2xl border-white/15 bg-white/[0.06] px-5 font-bold text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#templates">{t("hero.templatesCta")}</Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {["vocals", "prompt", "lyrics", "free"].map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-300"
                >
                  {t(`proof.${key}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[36px] border border-white/20 bg-white/[0.07] p-5 shadow-[0_34px_120px_rgba(0,0,0,0.52)] backdrop-blur">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/40 blur-2xl" />
            <div className="relative h-64 overflow-hidden rounded-[28px] border border-white/15 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.32),transparent_16%),radial-gradient(circle_at_70%_32%,rgba(34,211,238,0.36),transparent_19%),linear-gradient(135deg,#27105e_0%,#64194d_52%,#0b5361_100%)] md:h-72">
              <span className="absolute left-5 top-5 z-10 rounded-full border border-white/20 bg-black/35 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur">
                {t("player.badge")}
              </span>
              <span className="absolute bottom-6 right-7 z-10 h-32 w-32 animate-spin rounded-full border border-white/20 bg-[radial-gradient(circle,rgba(255,255,255,0.88)_0_5px,transparent_6px),repeating-radial-gradient(circle,rgba(255,255,255,0.22)_0_2px,rgba(255,255,255,0.04)_2px_8px),rgba(0,0,0,0.24)] [animation-duration:14s]" />
            </div>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-normal">
                  {t("player.title")}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {t("player.meta")}
                </p>
              </div>
              <button
                aria-label={t("player.play")}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-black shadow-2xl shadow-white/10"
              >
                <Play className="h-5 w-5 fill-current" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>0:58</span>
              <span>{t("player.madeWith")}</span>
              <span>2:34</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[48%] rounded-full bg-gradient-to-r from-violet-500 via-pink-600 to-cyan-400" />
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="bg-[#050509] py-16">
        <div className="container px-4 text-center md:px-6">
          <p className="text-sm font-black uppercase text-violet-300">
            {t("gallery.eyebrow")}
          </p>
          <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-black leading-none tracking-normal md:text-6xl">
            {t("gallery.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-4xl text-base leading-7 text-slate-400 md:text-xl">
            {t("gallery.subtitle")}
          </p>
        </div>
        <div className="relative mt-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#050509] to-transparent md:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#050509] to-transparent md:w-24" />
          <div className="flex w-max gap-4 pb-2 [animation:music-scroll_52s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...gallerySongs, ...gallerySongs].map((song, index) => (
              <GalleryCard key={`${song.key}-${index}`} song={song} />
            ))}
          </div>
        </div>
      </section>

      <MarketingSection
        id="styles"
        eyebrow={t("styles.eyebrow")}
        title={t("styles.title")}
        description={t("styles.subtitle")}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {styleCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href="/create"
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
              </Link>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection
        id="templates"
        eyebrow={t("templates.eyebrow")}
        title={t("templates.title")}
        description={t("templates.subtitle")}
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {templates.map((item) => (
            <article
              key={item.type}
              className="rounded-[26px] border border-white/10 bg-white/[0.055] p-6"
            >
              <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-2 text-xs font-black uppercase text-violet-200">
                {item.type}
              </span>
              <h3 className="mt-5 text-xl font-black tracking-normal">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.description}
              </p>
              <div className="mt-5 min-h-32 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm leading-7 text-slate-200">
                {item.prompt}
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <section className="bg-[#050509] py-14">
        <div className="container grid gap-8 rounded-[36px] border border-white/20 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.18),transparent_28%),rgba(255,255,255,0.052)] px-6 py-10 shadow-2xl shadow-black/30 md:px-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-violet-300">
              {t("commercial.eyebrow")}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-normal md:text-5xl">
              {t("commercial.title")}
            </h2>
            <p className="mt-4 max-w-xl leading-8 text-slate-400">
              {t("commercial.subtitle")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 px-5 font-black"
              >
                <Link href="/pricing">{t("commercial.pricingCta")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-2xl border-white/15 bg-white/[0.06] px-5 font-bold text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#faq">{t("commercial.faqCta")}</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 font-bold text-slate-200"
                >
                  <Icon className="h-5 w-5 text-cyan-300" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingSection
        eyebrow={t("howItWorks.eyebrow")}
        title={t("howItWorks.title")}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-[26px] border border-white/10 bg-white/[0.055] p-6"
            >
              <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-white text-base font-black text-black">
                {step.number}
              </div>
              <h3 className="text-xl font-black tracking-normal">
                {step.title}
              </h3>
              <p className="mt-2 leading-7 text-slate-400">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow={t("benefits.eyebrow")}
        title={t("benefits.title")}
        description={t("benefits.subtitle")}
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item) => (
            <article
              key={item.title}
              className="rounded-[26px] border border-white/10 bg-white/[0.055] p-6"
            >
              <CheckCircle2 className="mb-4 h-6 w-6 text-emerald-300" />
              <h3 className="text-xl font-black tracking-normal">
                {item.title}
              </h3>
              <p className="mt-2 leading-7 text-slate-400">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <section className="bg-[#050509] py-16">
        <div className="container px-4 md:px-6">
          <div className="rounded-[38px] border border-white/20 bg-[radial-gradient(circle_at_20%_18%,rgba(219,39,119,0.18),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.24),transparent_30%),rgba(255,255,255,0.058)] px-6 py-14 text-center shadow-[0_34px_120px_rgba(0,0,0,0.52)]">
            <p className="text-sm font-black uppercase text-violet-300">
              {t("pricingPreview.eyebrow")}
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-5xl">
              {t("pricingPreview.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl leading-8 text-slate-300">
              {t("pricingPreview.subtitle")}
            </p>
            <div className="mx-auto mt-7 grid max-w-3xl gap-3 md:grid-cols-3">
              {priceCards.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-left"
                >
                  <strong className="text-lg">{item.title}</strong>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 px-5 font-black"
              >
                <Link href="/create">{t("pricingPreview.primaryCta")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-2xl border-white/15 bg-white/[0.06] px-5 font-bold text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/pricing">{t("pricingPreview.secondaryCta")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection
        eyebrow={t("seoBlock.eyebrow")}
        title={t("seoBlock.title")}
      >
        <div className="columns-1 rounded-[30px] border border-white/10 bg-white/[0.035] p-6 leading-8 text-slate-400 md:columns-2 md:gap-10 md:p-8">
          <p>{t("seoBlock.p1")}</p>
          <p className="mt-6 md:mt-0">{t("seoBlock.p2")}</p>
        </div>
      </MarketingSection>

      <section id="faq" className="bg-[#050509] py-16">
        <div className="container px-4 md:px-6">
          <div className="mb-8 flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-violet-300" />
            <div>
              <p className="text-sm font-black uppercase text-violet-300">
                {t("faq.eyebrow")}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-normal md:text-5xl">
                {t("faq.title")}
              </h2>
            </div>
          </div>
          <div className="grid gap-3">
            {faqItems.map((item, index) => (
              <details
                key={item.question}
                open={index === 0}
                className="group rounded-[26px] border border-white/10 bg-white/[0.055]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 text-lg font-black [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span className="text-violet-300 group-open:hidden">+</span>
                  <span className="hidden text-violet-300 group-open:inline">
                    -
                  </span>
                </summary>
                <div className="px-5 pb-5 leading-7 text-slate-400">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function GalleryCard({ song }: { song: GallerySong }) {
  const coverStyle = {
    "--cover-bg": song.cover,
    "--avatar-bg": song.avatar,
  } as CSSProperties;

  return (
    <article className="w-44 shrink-0 md:w-56" style={coverStyle}>
      <div className="relative h-60 overflow-hidden rounded-xl bg-[image:var(--cover-bg)] shadow-2xl shadow-black/25 md:h-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.38),transparent_15%),radial-gradient(circle_at_76%_48%,rgba(255,255,255,0.18),transparent_20%),linear-gradient(to_bottom,rgba(0,0,0,0.08),transparent_48%,rgba(0,0,0,0.32))]" />
        <button
          aria-label={`Play ${song.title}`}
          className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
        >
          <CirclePlay className="h-5 w-5" />
        </button>
        <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/30 px-2 py-1.5 text-xs font-black text-white backdrop-blur">
            <Play className="h-3 w-3 fill-current" />
            {song.plays}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/30 px-2 py-1.5 text-xs font-black text-white backdrop-blur">
            <Star className="h-3 w-3 fill-current" />
            {song.rating}
          </span>
        </div>
      </div>
      <h3 className="mt-4 truncate text-lg font-black tracking-normal text-white">
        {song.title}
      </h3>
      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[image:var(--avatar-bg)] text-xs font-black text-white">
          {song.author.charAt(0)}
        </span>
        <span className="truncate">{song.author}</span>
      </div>
    </article>
  );
}

function MarketingSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-[#050509] py-14">
      <div className="container px-4 md:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase text-violet-300">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight tracking-normal md:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 leading-8 text-slate-400">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
