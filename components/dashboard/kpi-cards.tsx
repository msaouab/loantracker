"use client";

import {
  BadgeCheck,
  CircleDollarSign,
  HandCoins,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { DashboardStats } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type KpiStats = Pick<
  DashboardStats,
  | "totalClients"
  | "totalLoanAmount"
  | "amountRecovered"
  | "outstanding"
  | "recoveryRate"
  | "activeCount"
  | "recoveredClients"
  | "recoveredAmount"
  | "recoveredLoanCount"
  | "isAdminView"
>;

type KpiCard = {
  title: string;
  value: string;
  description: string;
};

type KpiCardStyle = {
  icon: LucideIcon;
  accent: string;
  iconBg: string;
};

const openCardStyles: KpiCardStyle[] = [
  {
    icon: Users,
    accent: "from-blue-500/15 to-blue-500/5",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    icon: Target,
    accent: "from-amber-500/15 to-amber-500/5",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: TrendingUp,
    accent: "from-emerald-500/15 to-emerald-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: CircleDollarSign,
    accent: "from-violet-500/15 to-violet-500/5",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

const recoveredCardStyles: KpiCardStyle[] = [
  {
    icon: BadgeCheck,
    accent: "from-teal-500/15 to-teal-500/5",
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    icon: HandCoins,
    accent: "from-rose-500/15 to-rose-500/5",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

function KpiCardGrid({
  cards,
  styles,
  className,
}: {
  cards: KpiCard[];
  styles: KpiCardStyle[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {cards.map((card, index) => {
        const style = styles[index];
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

export function KpiCards({ stats }: { stats: KpiStats }) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as AppLocale;

  const activeLoansLabel = stats.isAdminView
    ? t("activeLoansOrgWide", { count: stats.activeCount })
    : t("activeLoans", { count: stats.activeCount });

  const recoveredLoansLabel = stats.isAdminView
    ? t("recoveredLoansOrgWide", { count: stats.recoveredLoanCount })
    : t("recoveredLoans", { count: stats.recoveredLoanCount });

  const openCards: KpiCard[] = [
    {
      title: t("clients"),
      value: stats.totalClients.toString(),
      description: stats.isAdminView
        ? t("clientsDescriptionAdmin")
        : t("clientsDescription"),
    },
    {
      title: t("toCollect"),
      value: formatCurrency(stats.outstanding, locale),
      description: t("toCollectDescription", { activeLoans: activeLoansLabel }),
    },
    {
      title: t("collected"),
      value: formatCurrency(stats.amountRecovered, locale),
      description: t("collectedDescription", {
        rate: stats.recoveryRate.toFixed(1),
      }),
    },
    {
      title: t("fullBudget"),
      value: formatCurrency(stats.totalLoanAmount, locale),
      description: t("fullBudgetDescription", {
        collected: formatCurrency(stats.amountRecovered, locale),
        outstanding: formatCurrency(stats.outstanding, locale),
      }),
    },
  ];

  const recoveredCards: KpiCard[] = [
    {
      title: t("recoveredClients"),
      value: stats.recoveredClients.toString(),
      description: t("recoveredClientsDescription", {
        recoveredLoans: recoveredLoansLabel,
      }),
    },
    {
      title: t("recoveredAmount"),
      value: formatCurrency(stats.recoveredAmount, locale),
      description: t("recoveredAmountDescription"),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("openLoansSection")}
        </h2>
        <KpiCardGrid cards={openCards} styles={openCardStyles} className="xl:grid-cols-4" />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("recoveredLoansSection")}
        </h2>
        <KpiCardGrid cards={recoveredCards} styles={recoveredCardStyles} className="xl:grid-cols-2" />
      </section>
    </div>
  );
}
