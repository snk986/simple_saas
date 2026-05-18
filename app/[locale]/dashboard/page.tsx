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
import { defaultLocale, type Locale } from "@/config/i18n";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { getTranslations } from "next-intl/server";

function localizedSongHref(locale: Locale, id: string) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/song/${id}`;
}

function localizedReportHref(locale: Locale, id: string) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/report/${id}`;
}

function localizedPricingHref(locale: Locale) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/pricing`;
}

function localizedSignInHref(locale: Locale) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/sign-in`;
}

function localizedCreateHref(locale: Locale) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/ai-song-maker`;
}

function normalizeRows<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const ta = await getTranslations({ locale, namespace: "achievements" });
  const supabase = await createClient();

  // 1. Check Auth User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(localizedSignInHref(locale));
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
      )
    `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const subscription = normalizeRows(customerData?.subscriptions)[0] ?? null;
  const { data: songsData } = await supabase
    .from("songs")
    .select(
      "id,title,status,is_public,cover_url,audio_url,play_count,complete_count,share_count,cta_click_count,created_at,expires_at",
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
    const isVersionB = /\s*\(Version B\)$/.test(song.title);
    const displayTitle = isVersionB
      ? song.title.replace(/\s*\(Version B\)$/, "")
      : song.title;
    const versionLabel = isVersionB
      ? t("songList.versionB")
      : t("songList.versionA");

    return {
      listId: song.id,
      title: song.title,
      displayTitle,
      versionLabel,
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
      expiresAt: song.expires_at,
      audioUrl: song.audio_url,
    };
  });
  const unlockedAchievements = (achievementsData ?? []) as UserAchievement[];
  const localizedAchievements = achievements.map((achievement) => ({
    ...achievement,
    title: ta(`items.${achievement.id}.title`),
    description: ta(`items.${achievement.id}.description`),
  }));

  return (
    <div className="container flex w-full flex-1 flex-col gap-6 px-4 sm:gap-8 sm:px-8">
      {/* Welcome Banner */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/20 sm:mt-8 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
          {t("welcomeTitle", {
            name: customerData?.name || user.email?.split("@")[0],
          })}
        </h1>
        <p className="text-muted-foreground">{t("welcomeSubtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Card */}
        <CreditsBalanceCard
          credits={entitlements.creditsBalance}
          songRetentionDays={entitlements.songRetentionDays}
          labels={{
            availableCredits: t("creditsCard.availableCredits"),
            subscriberStorage: t("creditsCard.subscriberStorage"),
            freeStorage: t.raw("creditsCard.freeStorage") as string,
          }}
        />

        {/* Subscription Status */}
        <SubscriptionStatusCard
          subscription={subscription}
          entitlements={entitlements}
          locale={locale}
          labels={{
            currentPlan: t("subscriptionCard.currentPlan"),
            freePlan: t("subscriptionCard.freePlan"),
            basicPlan: t("subscriptionCard.basicPlan"),
            proPlan: t("subscriptionCard.proPlan"),
            storagePermanent: t("subscriptionCard.storagePermanent"),
            storageFree: t.raw("subscriptionCard.storageFree") as string,
            priorityEnabled: t("subscriptionCard.priorityEnabled"),
            priorityStandard: t("subscriptionCard.priorityStandard"),
            statuses: {
              active: t.raw("subscriptionCard.statuses.active") as string,
              trialing: t.raw("subscriptionCard.statuses.trialing") as string,
              canceledGrace: t.raw(
                "subscriptionCard.statuses.canceledGrace",
              ) as string,
              canceledEnded: t.raw(
                "subscriptionCard.statuses.canceledEnded",
              ) as string,
              pastDue: t.raw("subscriptionCard.statuses.pastDue") as string,
              unpaid: t("subscriptionCard.statuses.unpaid"),
              paused: t.raw("subscriptionCard.statuses.paused") as string,
              incomplete: t("subscriptionCard.statuses.incomplete"),
              expired: t.raw("subscriptionCard.statuses.expired") as string,
              noActivePlan: t("subscriptionCard.statuses.noActivePlan"),
            },
            portal: {
              viewPlans: t("portal.viewPlans"),
              managePlan: t("portal.managePlan"),
              dialogTitle: t("portal.dialogTitle"),
              dialogDescription: t("portal.dialogDescription"),
              paymentMethodsTitle: t("portal.paymentMethodsTitle"),
              paymentMethodsDescription: t("portal.paymentMethodsDescription"),
              billingHistoryTitle: t("portal.billingHistoryTitle"),
              billingHistoryDescription: t("portal.billingHistoryDescription"),
              planSettingsTitle: t("portal.planSettingsTitle"),
              planSettingsDescription: t("portal.planSettingsDescription"),
              accessFailed: t("portal.accessFailed"),
              accessFailedDescription: t("portal.accessFailedDescription"),
              redirecting: t("portal.redirecting"),
              continueToPortal: t("portal.continueToPortal"),
            },
          }}
          upgradeHref={localizedPricingHref(locale)}
        />
      </div>

      <SongList
        songs={songs}
        locale={locale}
        createHref={localizedCreateHref(locale)}
        canDownload={entitlements.plan !== "free"}
        labels={{
          title: t("songList.title"),
          subtitle: t("songList.subtitle"),
          createSong: t("songList.createSong"),
          emptyTitle: t("songList.emptyTitle"),
          emptySubtitle: t("songList.emptySubtitle"),
          coverAlt: t.raw("songList.coverAlt") as string,
          statusPublic: t("songList.statusPublic"),
          statusPrivate: t("songList.statusPrivate"),
          createdOn: t.raw("songList.createdOn") as string,
          expiresOn: t.raw("songList.expiresOn") as string,
          metrics: {
            plays: t("songList.metrics.plays"),
            full: t("songList.metrics.full"),
            shares: t("songList.metrics.shares"),
            cta: t("songList.metrics.cta"),
          },
          copyLink: t("songList.copyLink"),
          download: t("songList.download"),
          upgradeToDownload: t("songList.upgradeToDownload"),
          preview: t("songList.preview"),
          report: t("songList.report"),
          versionA: t("songList.versionA"),
          versionB: t("songList.versionB"),
        }}
      />
      <Achievements
        definitions={localizedAchievements}
        unlocked={unlockedAchievements}
        locale={locale}
        title={ta("title")}
        progressTemplate={ta.raw("progress") as string}
      />
    </div>
  );
}
