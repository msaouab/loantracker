import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/shared/auth-card";
import { LoginForm } from "@/components/forms/login-form";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect(session.user.isAdmin ? "/admin/dashboard" : "/dashboard");
  }

  const t = await getTranslations("auth");

  return (
    <AuthCard title={t("welcomeBack")} description={t("signInDescription")}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
