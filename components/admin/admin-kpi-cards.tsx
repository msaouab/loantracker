"use client";

import { useTranslations } from "next-intl";
import { Clock, Snowflake, UserCheck, Users } from "lucide-react";
import type { AdminDashboardStats } from "@/lib/admin-dashboard";
import { cn } from "@/lib/utils";

const cardStyles = [
  {
    icon: Users,
    accent: "from-blue-500/15 to-blue-500/5",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    icon: Clock,
    accent: "from-amber-500/15 to-amber-500/5",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: UserCheck,
    accent: "from-emerald-500/15 to-emerald-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Snowflake,
    accent: "from-violet-500/15 to-violet-500/5",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

export function AdminKpiCards({ stats }: { stats: AdminDashboardStats }) {
  const t = useTranslations("admin");

  const cards = [
    {
      title: t("managers"),
      value: stats.totalManagers.toString(),
      description: t("managersDescription"),
    },
    {
      title: t("pendingApproval"),
      value: stats.pendingCount.toString(),
      description: t("pendingDescription"),
    },
    {
      title: t("active"),
      value: stats.activeCount.toString(),
      description: t("activeDescription"),
    },
    {
      title: t("frozen"),
      value: stats.frozenCount.toString(),
      description: t("frozenDescription"),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const style = cardStyles[index];
        const Icon = style.icon;

        return (
          <div
            key={card.title}
            className={cn(
              "surface-card group relative overflow-hidden p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 sm:p-5",
              "bg-linear-to-br",
              style.accent
            )}
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 space-y-2 sm:space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl">
                  {card.value}
                </p>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                  style.iconBg
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
