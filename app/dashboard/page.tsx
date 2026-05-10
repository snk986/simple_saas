import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionStatusCard } from "@/components/dashboard/subscription-status-card";
import { CreditsBalanceCard } from "@/components/dashboard/credits-balance-card";
import {
  Achievements,
  type UserAchievement,
} from "@/components/dashboard/achievements";
import { SongList, type DashboardSong } from "@/components/dashboard/song-list";
import { achievements } from "@/config/achievements";
import { getUserEntitlements } from "@/lib/subscription/entitlements";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Check Auth User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const entitlements = await getUserEntitlements(user.id);
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
  const recentCreditsHistory = customerData?.credits_history?.slice(0, 2) || [];
  const { data: songsData } = await supabase
    .from("songs")
    .select(
      "id,title,status,is_public,cover_url,audio_url,audio_url_alt,play_count,complete_count,share_count,cta_click_count,created_at,expires_at",
    )
    .eq("user_id", user.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(20);
  const { data: achievementsData } = await supabase
    .from("achievements")
    .select("achievement,unlocked_at")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false });

  const songs: DashboardSong[] = (songsData ?? []).flatMap((song) => {
    const base = {
      title: song.title,
      status: song.status,
      isPublic: Boolean(song.is_public),
      coverUrl: song.cover_url,
      playCount: song.play_count ?? 0,
      completeCount: song.complete_count ?? 0,
      shareCount: song.share_count ?? 0,
      ctaClickCount: song.cta_click_count ?? 0,
      reportHref: `/report/${song.id}`,
      createdAt: song.created_at,
      expiresAt: song.expires_at,
    };

    return [
      {
        ...base,
        listId: song.id,
        versionLabel: song.audio_url_alt ? "Version A" : undefined,
        publicHref: `/song/${song.id}`,
      },
      ...(song.audio_url_alt
        ? [
            {
              ...base,
              listId: `${song.id}:legacy-alt`,
              versionLabel: "Version B",
              publicHref: `/song/${song.id}?take=alt`,
            },
          ]
        : []),
    ];
  });
  const unlockedAchievements = (achievementsData ?? []) as UserAchievement[];

  return (
    <div className="container flex w-full flex-1 flex-col gap-6 px-4 sm:gap-8 sm:px-8">
      {/* Welcome Banner */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/20 sm:mt-8 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
          Welcome back, {customerData?.name || user.email?.split("@")[0]}
        </h1>
        <p className="text-muted-foreground">
          Manage your plan, track credits, and keep an eye on song storage.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Card */}
        <CreditsBalanceCard
          credits={entitlements.creditsBalance}
          recentHistory={recentCreditsHistory}
          songRetentionDays={entitlements.songRetentionDays}
        />

        {/* Subscription Status */}
        <SubscriptionStatusCard
          subscription={subscription}
          entitlements={entitlements}
          upgradeHref="/pricing"
        />
      </div>

      <SongList songs={songs} />
      <Achievements
        definitions={achievements}
        unlocked={unlockedAchievements}
      />
    </div>
  );
}
