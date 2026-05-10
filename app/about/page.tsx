import type { Metadata } from "next";
import { AboutContent } from "@/components/about/about-content";
import { defaultLocale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";

export const metadata: Metadata = {
  title: "About Hit-Song - AI Music Creation From Personal Stories",
  description:
    "Learn how Hit-Song turns personal stories into AI-generated lyrics, audio, producer-style reports, and shareable song pages.",
  alternates: {
    canonical: absoluteLocaleUrl(defaultLocale, "/about"),
    languages: localizedAlternates("/about"),
  },
  openGraph: {
    title: "About Hit-Song",
    description:
      "Hit-Song is an AI music creation platform for turning stories into lyrics, audio, reports, and public song pages.",
    type: "website",
    url: absoluteLocaleUrl(defaultLocale, "/about"),
    siteName: "Hit-Song",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Hit-Song",
    description:
      "Turn personal stories into AI-generated lyrics, audio, reports, and shareable song pages.",
  },
};

export default function AboutPage() {
  return <AboutContent createHref="/create" pricingHref="/pricing" />;
}
