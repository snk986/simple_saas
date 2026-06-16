import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/blog-article";
import { blogArticles, getBlogArticle } from "@/config/blog-articles";
import { defaultLocale, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface BlogArticlePageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export function generateStaticParams() {
  return blogArticles.map((article) => ({
    locale: defaultLocale,
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getBlogArticle(slug);

  if (locale !== defaultLocale || !article) {
    return { title: "Calyra AI Blog", robots: { index: false, follow: false } };
  }

  const path = `/blog/${article.slug}`;
  const url = absoluteLocaleUrl(defaultLocale, path);

  return buildMarketingMetadata({
    title: article.seoTitle,
    description: article.metaDescription,
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates(path),
    },
    openGraph: { type: "article" },
  });
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { locale, slug } = await params;
  const article = getBlogArticle(slug);

  if (locale !== defaultLocale || !article) notFound();

  const url = absoluteLocaleUrl(defaultLocale, `/blog/${article.slug}`);
  const articleJsonLd =
    article.schemaType === "HowTo"
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: article.title,
          description: article.metaDescription,
          mainEntityOfPage: url,
          step: article.sections
            .flatMap((section) => section.steps ?? [])
            .map((step, index) => ({
              "@type": "HowToStep",
              position: index + 1,
              name: step.title,
              text: step.body,
            })),
        }
      : {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.metaDescription,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt ?? article.publishedAt,
          mainEntityOfPage: url,
          author: { "@type": "Organization", name: "Calyra AI" },
          publisher: { "@type": "Organization", name: "Calyra AI" },
        };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteLocaleUrl(defaultLocale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteLocaleUrl(defaultLocale, "/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogArticle article={article} />
    </>
  );
}
