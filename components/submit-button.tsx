"use client";

import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-client";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  analyticsEventName?: string;
  analyticsProperties?: Record<string, string | number | boolean | null>;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  analyticsEventName,
  analyticsProperties,
  onClick,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      aria-disabled={pending}
      onClick={(event) => {
        if (analyticsEventName) {
          trackFunnelEvent(analyticsEventName, analyticsProperties);
        }
        onClick?.(event);
      }}
      {...props}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
