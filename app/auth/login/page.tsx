import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/shared/auth-card";
import { LoginForm } from "@/components/forms/login-form";
import { getSession } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; passwordChanged?: string }>;
}) {
  const session = await getSession();
  if (session?.user) {
    redirect(session.user.isAdmin ? "/admin/dashboard" : "/dashboard");
  }

  const params = await searchParams;
  const t = await getTranslations("auth");

  return (
    <AuthCard title={t("welcomeBack")} description={t("signInDescription")}>
      <LoginForm
        registered={params.registered === "true"}
        passwordChanged={params.passwordChanged === "true"}
      />
    </AuthCard>
  );
}
