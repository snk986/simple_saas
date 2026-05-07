import { defaultLocale, type Locale } from "@/i18n/routing";
import { redirect } from "next/navigation";

interface PaymentSuccessPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function PaymentSuccessPage({
  params,
}: PaymentSuccessPageProps) {
  const { locale } = await params;
  const prefix = locale === defaultLocale ? "" : `/${locale}`;

  redirect(`${prefix}/create?upgraded=true`);
}
