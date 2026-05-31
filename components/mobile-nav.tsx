"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { signOutAction } from "@/app/actions";
import { useLocale } from "next-intl";
import { useState } from "react";

interface MobileNavProps {
  items: { label: string; href: string; prefetch?: false }[];
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isDashboard: boolean;
  labels: {
    title: string;
    toggle: string;
    dashboard: string;
    signIn: string;
    signUp: string;
    signOut: string;
  };
}

export function MobileNav({
  items,
  isAuthenticated,
  isAuthLoading,
  isDashboard,
  labels,
}: MobileNavProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{labels.toggle}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{labels.title}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.prefetch}
              onClick={() => setOpen(false)}
              className="text-lg font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t">
          {isAuthLoading ? null : isAuthenticated ? (
            <div className="flex flex-col gap-2">
              {!isDashboard && (
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href="/dashboard"
                    prefetch={false}
                    onClick={() => setOpen(false)}
                  >
                    {labels.dashboard}
                  </Link>
                </Button>
              )}
              <form action={signOutAction} className="w-full">
                <input type="hidden" name="locale" value={locale} />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  {labels.signOut}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link
                  href="/sign-in"
                  prefetch={false}
                  onClick={() => setOpen(false)}
                >
                  {labels.signIn}
                </Link>
              </Button>
              <Button asChild variant="default" className="w-full">
                <Link
                  href="/sign-up"
                  prefetch={false}
                  onClick={() => setOpen(false)}
                >
                  {labels.signUp}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
