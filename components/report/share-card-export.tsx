"use client";

import { Download, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareCardExportProps {
  songId: string;
  title: string;
  publicHref: string;
}

export function ShareCardExport({
  songId,
  title,
  publicHref,
}: ShareCardExportProps) {
  const t = useTranslations("report.actions");
  const { toast } = useToast();
  const imageHref = `/api/share/og?songId=${encodeURIComponent(songId)}`;

  async function shareSong() {
    const url = new URL(publicHref, window.location.origin).toString();

    if (navigator.share) {
      await navigator.share({
        title,
        url,
      });
    } else {
      await navigator.clipboard?.writeText(url);
      toast({ title: t("copied") });
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button asChild type="button" variant="outline" className="gap-2">
        <a href={imageHref} download={`hit-song-${songId}.png`}>
          <Download className="h-4 w-4" />
          {t("downloadShareCard")}
        </a>
      </Button>

      <Button type="button" variant="secondary" className="gap-2" onClick={shareSong}>
        <Share2 className="h-4 w-4" />
        {t("shareSong")}
      </Button>
    </div>
  );
}
