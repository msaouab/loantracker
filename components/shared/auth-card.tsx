"use client";

import {
  BarChart3,
  Landmark,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GuestLanguageSwitcher } from "@/components/shared/guest-language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    icon: Users,
    titleKey: "highlightClientTitle" as const,
    descriptionKey: "highlightClientDescription" as const,
  },
  {
    icon: BarChart3,
    titleKey: "highlightInsightsTitle" as const,
    descriptionKey: "highlightInsightsDescription" as const,
  },
  {
    icon: ShieldCheck,
    titleKey: "highlightSecureTitle" as const,
    descriptionKey: "highlightSecureDescription" as const,
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
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="auth-shell relative min-h-screen lg:grid lg:grid-cols-2">
      <div className="absolute inset-e-4 top-4 z-20 flex items-center gap-2 sm:inset-e-6 sm:top-6">
        <GuestLanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[#0b1220]" />
        <div className="absolute inset-0 bg-linear-to-br from-[#1d4ed8] via-[#2563eb] to-[#0f766e] opacity-95" />
        <div className="auth-brand-grid absolute inset-0 opacity-30" />
        <div className="absolute -inset-s-20 top-1/4 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -inset-e-24 top-0 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute bottom-0 inset-s-1/3 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">{tCommon("appName")}</p>
            <p className="text-sm text-white/70">{t("smartLoanTracking")}</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {t("modernLoanTracking")}
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl">
              {t("heroTitle")}
            </h2>
            <p className="max-w-md text-base leading-relaxed text-white/80">
              {t("heroDescription")}
            </p>
          </div>

          <div className="space-y-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.titleKey}
                  className="flex items-start gap-3 rounded-lg bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{t(item.titleKey)}</p>
                    <p className="mt-0.5 text-sm text-white/70">{t(item.descriptionKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/55">
          {t("footerTagline")}
        </p>
      </div>

      <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-16 pb-20 sm:px-8 sm:pb-16 lg:px-12">
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

        <p
          className="auth-signature-footer pointer-events-none absolute inset-x-0 bottom-4 z-20 pb-[max(0px,env(safe-area-inset-bottom))] text-center text-sm"
          aria-hidden="true"
        >
          Developed by{" "}
          <span className="auth-signature text-lg">Mohamed Saouab</span>
        </p>
      </div>
    </div>
  );
}
