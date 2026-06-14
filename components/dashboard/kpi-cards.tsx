import {
  CircleDollarSign,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/loans";
import type { DashboardStats } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

type KpiStats = Pick<
  DashboardStats,
  | "totalClients"
  | "totalLoanAmount"
  | "amountRecovered"
  | "ifAllRecovered"
  | "outstanding"
  | "recoveryRate"
  | "activeCount"
  | "recoveredCount"
  | "isAdminView"
>;

const cardStyles = [
  {
    icon: Users,
    accent: "from-blue-500/15 to-blue-500/5",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    icon: CircleDollarSign,
    accent: "from-violet-500/15 to-violet-500/5",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    icon: TrendingUp,
    accent: "from-emerald-500/15 to-emerald-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Target,
    accent: "from-amber-500/15 to-amber-500/5",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

export function KpiCards({ stats }: { stats: KpiStats }) {
  const loanBreakdown = stats.isAdminView
    ? `${stats.activeCount} active · ${stats.recoveredCount} repaid org-wide`
    : `${stats.activeCount} active · ${stats.recoveredCount} repaid`;

  const cards = [
    {
      title: "Clients",
      value: stats.totalClients.toString(),
      description: stats.isAdminView
        ? "Unique borrowers across all managers"
        : "Borrowers in your portfolio",
    },
    {
      title: "Portfolio Value",
      value: formatCurrency(stats.totalLoanAmount),
      description: `Total principal · ${loanBreakdown}`,
    },
    {
      title: "Collected",
      value: formatCurrency(stats.amountRecovered),
      description: `${stats.recoveryRate.toFixed(1)}% of portfolio recovered`,
    },
    {
      title: "Full Recovery Target",
      value: formatCurrency(stats.ifAllRecovered),
      description: `${formatCurrency(stats.outstanding)} left to collect`,
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
