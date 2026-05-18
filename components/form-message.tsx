"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  const { toast } = useToast();
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!("error" in message) || !message.error) {
      lastErrorRef.current = null;
      return;
    }

    if (lastErrorRef.current === message.error) {
      return;
    }

    lastErrorRef.current = message.error;
    toast({
      description: message.error,
      variant: "destructive",
    });
  }, [message, toast]);

  return (
    <div className="flex w-full max-w-md flex-col gap-2 text-sm">
      {"success" in message && (
        <div
          className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900"
          role="status"
          aria-live="polite"
        >
          {message.success}
        </div>
      )}
      {"message" in message && (
        <div
          className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900"
          role="status"
          aria-live="polite"
        >
          {message.message}
        </div>
      )}
    </div>
  );
}
