"use client";

import { Logo } from "./logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type FooterLink = {
  href: string;
  label: string;
  prefetch?: boolean;
  rel?: string;
  target?: string;
};

type FooterLinkGroup = {
  links: FooterLink[];
  title: string;
};

export function Footer() {
  const t = useTranslations("footer");
  const footerLinks: FooterLinkGroup[] = [
    {
      title: t("product"),
      links: [
        { label: t("aiSongMaker"), href: "/ai-song-maker", prefetch: false },
        { label: t("textToSong"), href: "/ai-text-to-song", prefetch: false },
        {
          label: t("lyricsToSong"),
          href: "/ai-lyrics-to-song",
          prefetch: false,
        },
        { label: t("aiLyricsGenerator"), href: "/ai-lyrics-generator" },
        { label: t("pricing"), href: "/pricing", prefetch: false },
      ],
    },
    {
      title: t("company"),
      links: [{ label: t("about"), href: "/about" }],
    },
    {
      title: t("legal"),
      links: [
        { label: t("privacy"), href: "/privacy" },
        { label: t("terms"), href: "/terms" },
        { label: t("refund"), href: "/refund" },
      ],
    },
    {
      title: t("contact"),
      links: [
        { label: "support@calyraai.com", href: "mailto:support@calyraai.com" },
      ],
    },
    {
      title: "Featured on",
      links: [
        {
          label: "Dang.ai",
          href: "https://dang.ai",
          target: "_blank",
          rel: "dofollow noopener",
        },
      ],
    },
  ];

  return (
    <footer className="border-t">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-full lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">{t("tagline")}</p>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-4">
            {footerLinks.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">{group.title}</h3>
                <nav className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={link.prefetch}
                      target={link.target}
                      rel={link.rel}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
