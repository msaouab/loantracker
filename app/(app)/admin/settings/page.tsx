import { getTranslations } from "next-intl/server";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { SettingsForm } from "@/components/forms/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { getSession, requireAdminOrRedirect } from "@/lib/session";

export default async function AdminSettingsPage() {
  await requireAdminOrRedirect();
  const [session, tSettings, tAdmin] = await Promise.all([
    getSession(),
    getTranslations("settings"),
    getTranslations("admin"),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={tSettings("title")}
        description={tAdmin("settingsDescription")}
      />
      <SettingsForm
        initialFullName={session?.user.name ?? ""}
        email={session?.user.email ?? ""}
      />
      <ActivityFeed
        admin
        embedded
        title={tSettings("activityTitle")}
        description={tAdmin("activitySettingsDescription")}
      />
    </div>
  );
}
