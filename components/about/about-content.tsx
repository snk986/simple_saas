import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Music2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AboutContentProps = {
  createHref: string;
  pricingHref: string;
  content: {
    eyebrow: string;
    title: string;
    subtitle: string;
    createCta: string;
    pricingCta: string;
    pillars: Array<{
      title: string;
      description: string;
    }>;
    whyEyebrow: string;
    whyTitle: string;
    whyBody: string[];
    trustEyebrow: string;
    trustTitle: string;
    trustBody: string;
    trustCta: string;
  };
};

const pillarIcons = [FileText, Music2, BarChart3];

export function AboutContent({
  createHref,
  pricingHref,
  content,
}: AboutContentProps) {
  return (
    <div className="bg-background">
      <section className="border-b border-border py-16 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {content.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal md:text-5xl">
              {content.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {content.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href={createHref}>
                  {content.createCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={pricingHref}>{content.pricingCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-5 md:grid-cols-3">
              {content.pillars.map((pillar, index) => {
                const Icon = pillarIcons[index % pillarIcons.length];

                return (
                  <article
                    key={pillar.title}
                    className="rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/20"
                  >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold">{pillar.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {pillar.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                {content.whyEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal">
                {content.whyTitle}
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              {content.whyBody.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/20 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  {content.trustEyebrow}
                </div>
                <h2 className="text-2xl font-bold tracking-normal">
                  {content.trustTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {content.trustBody}
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={createHref}>{content.trustCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
