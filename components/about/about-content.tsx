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
};

const pillars = [
  {
    title: "Story-first songwriting",
    description:
      "Hit-Song starts with the user's real memory, mood, or message, then turns it into structured lyrics with a clear emotional arc.",
    icon: FileText,
  },
  {
    title: "Audio generation workflow",
    description:
      "After the lyric draft is ready, the platform generates playable AI audio and saves the result to a public song page.",
    icon: Music2,
  },
  {
    title: "Producer-style feedback",
    description:
      "Reports help creators understand emotional value, hook strength, market positioning, and next steps for a song.",
    icon: BarChart3,
  },
];

export function AboutContent({ createHref, pricingHref }: AboutContentProps) {
  return (
    <div className="bg-background">
      <section className="border-b border-border py-16 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              About Hit-Song
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal md:text-5xl">
              An AI music creation platform built around personal stories
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Hit-Song helps people turn emotions, memories, and messages into
              lyrics, audio, and shareable song pages. The product is designed
              for creators who want a complete song workflow without starting
              from a blank studio session.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href={createHref}>
                  Create a song
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={pricingHref}>View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-5 md:grid-cols-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;

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
                Why we exist
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal">
                Creative tools should make the next step obvious
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              <p>
                Many AI music tools stop at generation. Hit-Song connects the
                full path: capture the story, shape the lyric, generate audio,
                evaluate the result, and publish a page that listeners and
                search engines can understand.
              </p>
              <p>
                The platform is intentionally practical. It shows generation
                status, credit impact, public links, reports, and storage
                behavior so creators can keep moving instead of guessing what
                happened.
              </p>
              <p>
                Public song pages are built to include the audio, lyrics, song
                details, and related music in indexable HTML, helping each
                finished song become a useful share asset rather than a hidden
                file.
              </p>
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
                  Built for trust
                </div>
                <h2 className="text-2xl font-bold tracking-normal">
                  Clear credits, private account pages, and public songs only
                  when a creator chooses to publish
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Account pages are protected by Supabase authentication.
                  Sensitive provider keys stay server-side, and payment flows
                  are handled through Creem checkout and customer portal routes.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={createHref}>Start creating</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
