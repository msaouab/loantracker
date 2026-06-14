import {
  BarChart3,
  Landmark,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/app-config";

const highlights = [
  {
    icon: Users,
    title: "Client tracking",
    description: "Keep every borrower organized in one place.",
  },
  {
    icon: BarChart3,
    title: "Live insights",
    description: "Monitor recoveries and outstanding balances instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Simple & secure",
    description: "Built for managers who need clarity without complexity.",
  },
];

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell relative min-h-screen lg:grid lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[#0b1220]" />
        <div className="absolute inset-0 bg-linear-to-br from-[#1d4ed8] via-[#2563eb] to-[#0f766e] opacity-95" />
        <div className="auth-brand-grid absolute inset-0 opacity-30" />
        <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
            <p className="text-sm text-white/70">Smart loan tracking</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Modern loan tracking
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
              Manage loans with clarity and confidence.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-white/80">
              Track clients, monitor recoveries, and stay on top of outstanding
              balances from one clean dashboard.
            </p>
          </div>

          <div className="space-y-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-0.5 text-sm text-white/70">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/55">
          Built for managers who want simplicity without sacrificing insight.
        </p>
      </div>

      <div className="flex min-h-screen w-full items-center justify-center px-4 py-16 sm:px-8 lg:px-12">
        <Card className="glass-card mx-auto w-full max-w-md border-0">
          <CardHeader className="space-y-3 pb-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary lg:hidden">
              <Landmark className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="mx-auto max-w-sm text-base">
                {description}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="mx-auto w-full max-w-sm pt-2">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
