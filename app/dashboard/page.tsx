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
      "id,title,status,is_public,cover_url,play_count,complete_count,share_count,cta_click_count,created_at,expires_at",
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

  const songs: DashboardSong[] = (songsData ?? []).map((song) => {
    const versionLabel = song.title.endsWith("(Version B)")
      ? "Version B"
      : undefined;

    return {
      listId: song.id,
      title: song.title,
      versionLabel,
      status: song.status,
      isPublic: Boolean(song.is_public),
      coverUrl: song.cover_url,
      playCount: song.play_count ?? 0,
      completeCount: song.complete_count ?? 0,
      shareCount: song.share_count ?? 0,
      ctaClickCount: song.cta_click_count ?? 0,
      publicHref: `/song/${song.id}`,
      reportHref: `/report/${song.id}`,
      createdAt: song.created_at,
      expiresAt: song.expires_at,
    };
  });
  const unlockedAchievements = (achievementsData ?? []) as UserAchievement[];
  const createHref = "/create";
  const pricingHref = "/pricing";

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
          locale="en"
          labels={{
            availableCredits: "Available Credits",
            subscriberStorage: "Songs created while subscribed are kept permanently.",
            freeStorage: "Free songs are kept for {days} days.",
            recentActivity: "Recent Activity",
            noRecentActivity: "No recent activity yet.",
          }}
        />

        {/* Subscription Status */}
        <SubscriptionStatusCard
          subscription={subscription}
          entitlements={entitlements}
          locale="en"
          labels={{
            currentPlan: "Current Plan",
            freePlan: "Free",
            basicPlan: "Basic",
            proPlan: "Pro",
            storagePermanent: "Permanent storage for subscriber songs",
            storageFree: "{days}-day storage for free songs",
            priorityEnabled: "Priority generation enabled",
            priorityStandard: "Standard generation queue",
            statuses: {
              active: "Renews on {date}",
              trialing: "Trial ends on {date}",
              canceledGrace: "Access until {date}",
              canceledEnded: "Ended on {date}",
              pastDue: "Payment due - Access until {date}",
              unpaid: "Payment required",
              paused: "Paused until {date}",
              incomplete: "Setup incomplete",
              expired: "Expired on {date}",
              noActivePlan: "No active plan",
            },
            portal: {
              viewPlans: "View plans",
              managePlan: "Manage Plan",
              dialogTitle: "Subscription Management",
              dialogDescription: "Access your subscription settings in our secure customer portal.",
              paymentMethodsTitle: "Payment Methods",
              paymentMethodsDescription: "Update your billing information",
              billingHistoryTitle: "Billing History",
              billingHistoryDescription: "View past invoices and payments",
              planSettingsTitle: "Plan Settings",
              planSettingsDescription: "Change or cancel your subscription",
              accessFailed: "Failed to access subscription portal.",
              accessFailedDescription: "Please try again later.",
              redirecting: "Redirecting...",
              continueToPortal: "Continue to Portal",
            },
          }}
          upgradeHref={pricingHref}
        />
      </div>

      <SongList
        songs={songs}
        locale="en"
        createHref={createHref}
        labels={{
          title: "Your songs",
          subtitle: "Public links, listening metrics, and share performance.",
          createSong: "Create song",
          emptyTitle: "No songs yet",
          emptySubtitle: "Create your first song to publish a searchable music page.",
          coverAlt: "{title} cover art",
          statusPublic: "Public",
          statusPrivate: "Private",
          createdOn: "Created {date}",
          expiresOn: "Expires {date}",
          metrics: {
            plays: "Plays",
            full: "Full",
            shares: "Shares",
            cta: "CTA",
          },
          copyLink: "Copy link",
          preview: "Preview",
          report: "Report",
          versionB: "Version B",
        }}
      />
      <Achievements
        definitions={achievements}
        unlocked={unlockedAchievements}
        locale="en"
        title="Achievements"
        progressTemplate="{unlocked} of {total} unlocked"
      />
    </div>
  );
}
