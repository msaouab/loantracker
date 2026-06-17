"use client";

import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { getActivityEmptyKey } from "@/lib/activity-i18n";
import type { ActivityTab } from "@/lib/activity-log";
import { cn } from "@/lib/utils";

export function ActivityEmptyState({
  admin = false,
  tab = "all",
}: {
  admin?: boolean;
  tab?: ActivityTab;
}) {
  const t = useTranslations("activity");
  const title = tab === "all" ? t("noActivity") : t("nothingHere");
  const description = t(getActivityEmptyKey(tab, admin));

  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
      <div
        className={cn(
          "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/20"
        )}
      >
        <History className="h-7 w-7" strokeWidth={1.75} />
      </div>

      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
