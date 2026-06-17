import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/shared/auth-card";
import { RegisterForm } from "@/components/forms/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <AuthCard
      title={t("createAccountTitle")}
      description={t("createAccountDescription")}
    >
      <RegisterForm />
    </AuthCard>
  );
}
