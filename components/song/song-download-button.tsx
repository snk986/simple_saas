"use client";

import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SongDownloadButtonProps {
  songId: string;
  children?: ReactNode;
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

function filenameFromDisposition(disposition: string | null) {
  const match = disposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? "calyra-ai-song.mp3";
}

export function SongDownloadButton({
  songId,
  children,
  className,
  iconClassName = "h-4 w-4",
  ariaLabel = "Download song",
  disabled = false,
  size = "sm",
  variant = "outline",
}: SongDownloadButtonProps) {
  const { toast } = useToast();

  const downloadSong = async () => {
    try {
      toast({ title: "Preparing download", duration: 1000 });

      const response = await fetch(`/api/song/${songId}/download`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromDisposition(
        response.headers.get("content-disposition"),
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Download failed", duration: 1600 });
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={downloadSong}
    >
      <Download className={iconClassName} />
      {children}
    </Button>
  );
}
