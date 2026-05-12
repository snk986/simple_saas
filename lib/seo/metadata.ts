import type { Metadata } from "next";
import { baseUrl } from "@/lib/i18n/urls";

const defaultOgImageUrl = `${baseUrl}/og/hit-song-cover.png`;

type BuildMarketingMetadataInput = {
  title: string;
  description: string;
  url: string;
  alternates?: Metadata["alternates"];
  locale?: string;
  openGraph?: Partial<NonNullable<Metadata["openGraph"]>>;
  twitter?: Partial<NonNullable<Metadata["twitter"]>>;
};

export function buildMarketingMetadata({
  title,
  description,
  url,
  alternates,
  locale,
  openGraph,
  twitter,
}: BuildMarketingMetadataInput): Metadata {
  const defaultImage = {
    url: defaultOgImageUrl,
    width: 1536,
    height: 1024,
    alt: "Hit-Song: Turn Your Story Into an AI Song",
  };

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Hit-Song",
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
