import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionStatusCard } from "@/components/dashboard/subscription-status-card";
import { CreditsBalanceCard } from "@/components/dashboard/credits-balance-card";
import { SongList, type DashboardSong } from "@/components/dashboard/song-list";
import { defaultLocale, type Locale } from "@/config/i18n";

function localizedSongHref(locale: Locale, id: string) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/song/${id}`;
}

function localizedReportHref(locale: Locale, id: string) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/report/${id}`;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // 1. Check Auth User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // 2. Fetch Customer Data (Credits, Subscription)
  // We use a single query to get the customer profile + related subscription & credits_balance history
  const { data: customerData } = await supabase
    .from("customers")
    .select(
      `
      *,
      subscriptions (
        status,
        current_period_end,
        creem_product_id
      ),
      credits_history (
        amount,
        type,
        created_at
      )
    `,
    )
    .eq("user_id", user.id)
    .single();

  const subscription = customerData?.subscriptions?.[0];
  const credits_balance = customerData?.credits_balance || 0;
  const recentCreditsHistory = customerData?.credits_history?.slice(0, 2) || [];
  const { data: songsData } = await supabase
    .from("songs")
    .select(
      "id,title,status,is_public,cover_url,play_count,complete_count,share_count,cta_click_count,created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const songs: DashboardSong[] = (songsData ?? []).map((song) => ({
    id: song.id,
    title: song.title,
    status: song.status,
    isPublic: Boolean(song.is_public),
    coverUrl: song.cover_url,
    playCount: song.play_count ?? 0,
    completeCount: song.complete_count ?? 0,
    shareCount: song.share_count ?? 0,
    ctaClickCount: song.cta_click_count ?? 0,
    publicHref: localizedSongHref(locale, song.id),
    reportHref: localizedReportHref(locale, song.id),
    createdAt: song.created_at,
  }));

  return (
    <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 px-4 sm:px-8 container">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border rounded-lg p-6 sm:p-8 mt-6 sm:mt-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
          Welcome back, {customerData?.name || user.email?.split("@")[0]}
        </h1>
        <p className="text-muted-foreground">
          Manage your subscription, check your credits_balance, and access your
          dashboard features.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Card */}
        <CreditsBalanceCard
          credits={credits_balance}
          recentHistory={recentCreditsHistory}
        />

        {/* Subscription Status */}
        <SubscriptionStatusCard subscription={subscription} />
      </div>

      <SongList songs={songs} />
    </div>
  );
}
