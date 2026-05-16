import { Link } from "@/i18n/navigation";

type LegalSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

type LegalDocumentProps = {
  backLabel: string;
  backHref: string;
  badge: string;
  title: string;
  subtitle: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  sections: LegalSection[];
  relatedTitle: string;
  relatedLinks: Array<{ label: string; href: string }>;
  contactTitle: string;
  contactBody: string;
  contactCtaLabel: string;
  contactCtaHref: string;
  contactEmailLabel?: string;
};

export function LegalDocument({
  backLabel,
  backHref,
  badge,
  title,
  subtitle,
  lastUpdatedLabel,
  lastUpdated,
  sections,
  relatedTitle,
  relatedLinks,
  contactTitle,
  contactBody,
  contactCtaLabel,
  contactCtaHref,
  contactEmailLabel = "Email support",
}: LegalDocumentProps) {
  return (
    <div className="bg-background">
      <div className="border-b border-border">
        <div className="container px-4 py-4 md:px-6">
          <Link
            href={backHref}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {backLabel}
          </Link>
        </div>
      </div>

      <div className="container px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <header className="space-y-4">
            <div className="inline-flex rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              {badge}
            </div>
            <h1 className="text-3xl font-bold tracking-normal md:text-4xl">
              {title}
            </h1>
            <p className="text-muted-foreground">{subtitle}</p>
            <p className="text-sm text-muted-foreground">
              {lastUpdatedLabel}: {lastUpdated}
            </p>
          </header>

          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                {section.body ? (
                  <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
                {section.bullets ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <section className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">{relatedTitle}</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">{contactTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {contactBody}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={contactCtaHref}
                className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {contactCtaLabel}
              </Link>
              <a
                href="mailto:support@calyraai.com"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {contactEmailLabel}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
