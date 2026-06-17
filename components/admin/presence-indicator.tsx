"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelativeTime } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";
import { isOnline } from "@/lib/presence";

function getPresenceLabel(
  lastSeenAt: string | null,
  locale: AppLocale,
  labels: {
    online: string;
    offline: string;
    lastSeen: (time: string) => string;
  }
) {
  if (isOnline(lastSeenAt)) {
    return labels.online;
  }

  if (lastSeenAt) {
    return labels.lastSeen(formatRelativeTime(lastSeenAt, locale));
  }

  return labels.offline;
}

export function PresenceIndicator({
  lastSeenAt,
}: {
  lastSeenAt: string | null;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("admin");
  const labels = {
    online: t("online"),
    offline: t("offline"),
    lastSeen: (time: string) => t("lastSeen", { time }),
  };
  const label = getPresenceLabel(lastSeenAt, locale, labels);
  const online = isOnline(lastSeenAt);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex size-4 shrink-0 cursor-default items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          tabIndex={0}
          role="img"
          aria-label={label}
        >
          <span
            className={`size-2 rounded-full ${online ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}
