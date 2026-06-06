"use client";

import { signOutAction } from "@/app/actions";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { locales, type Locale } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/client";

interface NavItem {
  label: string;
  href: string;
  englishOnly?: boolean;
  prefetch?: false;
}

type AuthState = "loading" | "signed-in" | "signed-out";

export default function Header() {
  const isDev = process.env.NODE_ENV === "development";
  const visibleLocales = isDev ? locales : locales.filter((l) => l !== "zh-CN");
  const [authState, setAuthState] = useState<AuthState>("loading");

  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const isDashboard = pathname?.startsWith("/dashboard");
  const isBlog = pathname === "/blog" || pathname?.startsWith("/blog/");
  const isAuthenticated = authState === "signed-in";

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setAuthState(data.user ? "signed-in" : "signed-out");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session?.user ? "signed-in" : "signed-out");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const mainNavItems: NavItem[] = [
    { label: t("aiSongMaker"), href: "/ai-song-maker", prefetch: false },
    { label: t("textToSong"), href: "/ai-text-to-song", prefetch: false },
    { label: t("lyricsToSong"), href: "/ai-lyrics-to-song", prefetch: false },
    { label: t("aiLyricsGenerator"), href: "/ai-lyrics-generator" },
    { label: t("blog"), href: "/blog", englishOnly: true },
    { label: t("pricing"), href: "/pricing", prefetch: false },
    { label: t("about"), href: "/about" },
  ];

  const dashboardItems: NavItem[] = [];
  const navItems = isDashboard ? dashboardItems : mainNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Logo />
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 transform items-center gap-5 lg:flex">
          {navItems.map((item) =>
            item.englishOnly ? (
              <NextLink
                key={item.href}
                href={item.href}
                prefetch={item.prefetch}
                className="whitespace-nowrap text-sm font-semibold text-muted-foreground transition-colors hover:text-primary lg:text-base"
              >
                {item.label}
              </NextLink>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                prefetch={item.prefetch}
                className="whitespace-nowrap text-sm font-semibold text-muted-foreground transition-colors hover:text-primary lg:text-base"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {!isBlog && (
            <select
              aria-label={t("language")}
              value={locale}
              onChange={(event) =>
                router.replace(pathname || "/", {
                  locale: event.target.value as Locale,
                })
              }
              className="h-9 rounded-md border bg-background px-2 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {visibleLocales.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          )}
          {authState === "loading" ? null : isAuthenticated ? (
            <div className="hidden items-center gap-2 lg:flex">
              {!isDashboard && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard" prefetch={false}>
                    {t("dashboard")}
                  </Link>
                </Button>
              )}
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit" variant="outline" size="sm">
                  {t("signOut")}
                </Button>
              </form>
            </div>
          ) : (
            <div className="hidden gap-2 lg:flex">
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in" prefetch={false}>
                  {t("signIn")}
                </Link>
              </Button>
            </div>
          )}
          <MobileNav
            items={navItems}
            isAuthenticated={isAuthenticated}
            isAuthLoading={authState === "loading"}
            isDashboard={isDashboard}
            labels={{
              title: t("navigation"),
              toggle: t("toggleMenu"),
              dashboard: t("dashboard"),
              signIn: t("signIn"),
              signUp: t("signUp"),
              signOut: t("signOut"),
            }}
          />
        </div>
      </div>
    </header>
  );
}
