import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/routing";
import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <NextIntlClientProvider messages={messages}>
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
