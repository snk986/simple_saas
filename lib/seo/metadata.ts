import type { Metadata } from "next";
import { baseUrl } from "@/lib/i18n/urls";

const defaultOgImageUrl = `${baseUrl}/og/calyra-ai-cover.jpg`;

type BuildMarketingMetadataInput = {
  title: string;
  description: string;
  url: string;
  alternates?: Metadata["alternates"];
  robots?: Metadata["robots"];
  locale?: string;
  openGraph?: Partial<NonNullable<Metadata["openGraph"]>>;
  twitter?: Partial<NonNullable<Metadata["twitter"]>>;
};

export function buildMarketingMetadata({
  title,
  description,
  url,
  alternates,
  robots,
  locale,
  openGraph,
  twitter,
}: BuildMarketingMetadataInput): Metadata {
  const defaultImage = {
    url: defaultOgImageUrl,
    width: 1200,
    height: 630,
    alt: "Calyra AI: Create AI Music from Text",
  };

  return {
    title,
    description,
    alternates,
    robots,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Calyra AI",
      locale,
      images: [defaultImage],
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImageUrl],
      ...twitter,
    },
  };
}
