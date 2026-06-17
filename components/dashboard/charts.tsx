"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";

type DashboardChartsProps = {
  trustDistribution: { trusted: number; notTrusted: number };
  recoveryProgress: { recovered: number; outstanding: number };
  topClients: { name: string; amount: number }[];
};

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export function DashboardCharts({
  trustDistribution,
  recoveryProgress,
  topClients,
}: DashboardChartsProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as AppLocale;

  const recoveryData = [
    { name: t("recovered"), value: recoveryProgress.recovered },
    { name: t("outstanding"), value: recoveryProgress.outstanding },
  ];

  const trustData = [
    { name: t("trusted"), value: trustDistribution.trusted },
    { name: t("notTrusted"), value: trustDistribution.notTrusted },
  ];

  const formatAmount = (value: number) => formatCurrency(value, locale);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title={t("recoveryProgress")}>
        <PieChartSection
          data={recoveryData}
          formatter={formatAmount}
          noDataLabel={t("noData")}
          pieLabel={t}
        />
      </ChartCard>

      <ChartCard title={t("trustDistribution")}>
        <PieChartSection
          data={trustData}
          noDataLabel={t("noData")}
          pieLabel={t}
        />
      </ChartCard>

      <ChartCard title={t("topClients")}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topClients} margin={{ bottom: 8, left: 0, right: 8 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={56}
            />
            <YAxis
              width={48}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) =>
                value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
              }
            />
            <Tooltip
              formatter={(value) =>
                formatAmount(typeof value === "number" ? value : Number(value))
              }
            />
            <Bar dataKey="amount" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3 sm:px-5 sm:py-4">
        <h3 className="text-sm font-semibold tracking-tight sm:text-base">{title}</h3>
      </div>
      <div className="px-4 py-3 sm:px-5 sm:py-4">{children}</div>
    </div>
  );
}

function PieChartSection({
  data,
  formatter,
  noDataLabel,
  pieLabel,
}: {
  data: { name: string; value: number }[];
  formatter?: (value: number) => string;
  noDataLabel: string;
  pieLabel: (key: "pieLabel", values: { name: string; percent: string }) => string;
}) {
  const filtered = data.filter((item) => item.value > 0);

  if (filtered.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">{noDataLabel}</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={72}
          label={({ name, percent }) =>
            pieLabel("pieLabel", {
              name: name ?? "",
              percent: ((percent ?? 0) * 100).toFixed(0),
            })
          }
        >
          {filtered.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            formatter
              ? formatter(typeof value === "number" ? value : Number(value))
              : String(value)
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
