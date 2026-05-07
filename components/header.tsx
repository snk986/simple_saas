"use client";

import { signOutAction } from "@/app/actions";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { locales, type Locale } from "@/i18n/routing";

interface HeaderProps {
  user: any;
}

interface NavItem {
  label: string;
  href: string;
}

export default function Header({ user }: HeaderProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const isDashboard = pathname?.startsWith("/dashboard");

  const mainNavItems: NavItem[] = [
    { label: t("home"), href: "/" },
    { label: t("features"), href: "/#how-it-works" },
    { label: t("pricing"), href: "/pricing" },
  ];

  const dashboardItems: NavItem[] = [];
  const navItems = isDashboard ? dashboardItems : mainNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Logo />
        </div>
        
        {/* Centered Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
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
            {locales.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
          <ThemeSwitcher />
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {isDashboard && (
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {user.email}
                </span>
              )}
              {!isDashboard && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard">{t("dashboard")}</Link>
                </Button>
              )}
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  {t("signOut")}
                </Button>
              </form>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">{t("signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">{t("signUp")}</Link>
              </Button>
            </div>
          )}
          <MobileNav
            items={navItems}
            user={user}
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
