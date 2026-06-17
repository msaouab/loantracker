import { getTranslations } from "next-intl/server";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { SettingsForm } from "@/components/forms/settings-form";
import { DeletedLoans } from "@/components/settings/deleted-loans";
import { PageHeader } from "@/components/shared/page-header";
import { getSession, redirectToLogin } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    return redirectToLogin();
  }

  const t = await getTranslations("settings");

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} description={t("description")} />
      <SettingsForm
        initialFullName={session.user.name ?? ""}
        email={session.user.email ?? ""}
        initialLocale={session.user.locale ?? "en"}
      />
      <DeletedLoans />
      <ActivityFeed
        embedded
        title={t("activityTitle")}
        description={t("activityDescription")}
      />
    </div>
  );
}
