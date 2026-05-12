import { CheckCircle2, Lock, Trophy } from "lucide-react";
import type {
  AchievementDefinition,
  AchievementId,
} from "@/config/achievements";
import { cn } from "@/lib/utils";

export interface UserAchievement {
  achievement: AchievementId;
  unlocked_at: string;
}

interface AchievementsProps {
  definitions: AchievementDefinition[];
  unlocked: UserAchievement[];
  locale: string;
  title: string;
  progressTemplate: string;
}

function formatProgress(template: string, unlocked: number, total: number) {
  return template
    .replace("{unlocked}", String(unlocked))
    .replace("{total}", String(total));
}

export function Achievements({
  definitions,
  unlocked,
  locale,
  title,
  progressTemplate,
}: AchievementsProps) {
  const unlockedMap = new Map(
    unlocked.map((achievement) => [
      achievement.achievement,
      achievement.unlocked_at,
    ]),
  );
  const unlockedCount = unlockedMap.size;

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm shadow-black/20 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatProgress(progressTemplate, unlockedCount, definitions.length)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {definitions.map((achievement) => {
          const unlockedAt = unlockedMap.get(achievement.id);
          const isUnlocked = Boolean(unlockedAt);

          return (
            <article
              key={achievement.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                isUnlocked
                  ? "border-primary/30 bg-primary/10"
                  : "border-border bg-muted/20 opacity-75",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md",
                    isUnlocked
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isUnlocked ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                {unlockedAt ? (
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(unlockedAt))}
                  </span>
                ) : null}
              </div>
              <h3 className="text-sm font-semibold">{achievement.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {achievement.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
