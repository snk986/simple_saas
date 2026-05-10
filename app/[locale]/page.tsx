import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music, Mic, Star, CheckCircle2 } from "lucide-react";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { locales, type Locale } from "@/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.seo" });
  const url = absoluteLocaleUrl(locale);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: url,
      languages: localizedAlternates(),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      url,
      siteName: "Hit-Song",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const steps = [
    {
      title: t("steps.story.title"),
      description: t("steps.story.description"),
      icon: <Mic className="h-6 w-6" />,
    },
    {
      title: t("steps.lyrics.title"),
      description: t("steps.lyrics.description"),
      icon: <Music className="h-6 w-6" />,
    },
    {
      title: t("steps.song.title"),
      description: t("steps.song.description"),
      icon: <Star className="h-6 w-6" />,
    },
  ];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hit-Song",
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-border py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {t("eyebrow")}
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-foreground md:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                {t("hero.subtitle")}
              </p>
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {t("proof.lyrics")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {t("proof.audio")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {t("proof.report")}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-8 text-base gap-2">
                  <Link href="/create">
                    {t("hero.primaryCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base"
                >
                  <Link href="#how-it-works">{t("hero.secondaryCta")}</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm shadow-black/20">
              <div className="space-y-4 rounded-lg border border-border bg-background p-5">
                <p className="text-xs font-semibold uppercase tracking-normal text-primary">
                  {t("demo.label")}
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("demo.prompt")}
                </p>
                <div className="rounded-md border border-border bg-muted/50 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {t("demo.outputTitle")}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {t("demo.output")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-b border-border bg-muted/30 py-20"
      >
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t("howItWorks.title")}</h2>
            <p className="text-muted-foreground text-lg">
              {t("howItWorks.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-lg border border-border bg-card p-8 text-center shadow-sm shadow-black/20"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 text-primary mx-auto">
                  {step.icon}
                </div>
                <div className="text-sm font-semibold text-primary mb-2">
                  {t("howItWorks.step", { number: index + 1 })}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container px-4 md:px-6 text-center">
          <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card px-5 py-12 shadow-sm shadow-black/20">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              {t("finalCta.title")}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              {t("finalCta.subtitle")}
            </p>
            <Button asChild size="lg" className="h-12 px-8 text-lg">
              <Link href="/create">{t("finalCta.button")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
