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
import { formatCurrency } from "@/lib/loans";

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
  const recoveryData = [
    { name: "Recovered", value: recoveryProgress.recovered },
    { name: "Outstanding", value: recoveryProgress.outstanding },
  ];

  const trustData = [
    { name: "Trusted", value: trustDistribution.trusted },
    { name: "Not trusted", value: trustDistribution.notTrusted },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Recovery Progress">
        <PieChartSection data={recoveryData} formatter={formatCurrency} />
      </ChartCard>

      <ChartCard title="Trust Distribution">
        <PieChartSection data={trustData} />
      </ChartCard>

      <ChartCard title="Top Clients by Loan Amount">
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
                formatCurrency(typeof value === "number" ? value : Number(value))
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
}: {
  data: { name: string; value: number }[];
  formatter?: (value: number) => string;
}) {
  const filtered = data.filter((item) => item.value > 0);

  if (filtered.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">No data yet</p>
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
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
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
