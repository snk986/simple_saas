import { ACHIEVEMENT_IDS, type AchievementId } from "@/config/achievements";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

interface SongAchievementStats {
  status?: string | null;
  total_score?: number | null;
  report_data?: unknown;
  play_count?: number | null;
  share_count?: number | null;
}

export async function checkAchievements(userId: string) {
  const supabase = createServiceRoleClient();

  const { data: songs, error: songsError } = await supabase
    .from("songs")
    .select("status,total_score,report_data,play_count,share_count")
    .eq("user_id", userId);

  if (songsError) {
    throw songsError;
  }

  const songStats = (songs ?? []) as SongAchievementStats[];
  const totalPlays = songStats.reduce(
    (sum, song) => sum + (song.play_count ?? 0),
    0,
  );
  const totalShares = songStats.reduce(
    (sum, song) => sum + (song.share_count ?? 0),
    0,
  );
  const highestScore = songStats.reduce(
    (max, song) => Math.max(max, song.total_score ?? 0),
    0,
  );
  const nextAchievements = new Set<AchievementId>();

  if (songStats.length >= 1) {
    nextAchievements.add("first_song");
  }

  if (songStats.some((song) => song.status === "ready")) {
    nextAchievements.add("first_ready_song");
  }

  if (songStats.some((song) => Boolean(song.report_data))) {
    nextAchievements.add("first_report");
  }

  if (highestScore >= 80) {
    nextAchievements.add("score_80");
  }

  if (highestScore >= 90) {
    nextAchievements.add("score_90");
  }

  if (songStats.length >= 3) {
    nextAchievements.add("songs_3");
  }

  if (totalPlays >= 50) {
    nextAchievements.add("plays_50");
  }

  if (totalShares >= 10) {
    nextAchievements.add("shares_10");
  }

  const unlocked = Array.from(nextAchievements).filter((achievement) =>
    ACHIEVEMENT_IDS.includes(achievement),
  );

  if (unlocked.length === 0) {
    return [];
  }

  const { error: upsertError } = await supabase.from("achievements").upsert(
    unlocked.map((achievement) => ({
      user_id: userId,
      achievement,
    })),
    {
      onConflict: "user_id,achievement",
      ignoreDuplicates: true,
    },
  );

  if (upsertError) {
    throw upsertError;
  }

  return unlocked;
}
