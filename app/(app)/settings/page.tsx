import { redirect } from "next/navigation";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { SettingsForm } from "@/components/forms/settings-form";
import { DeletedLoans } from "@/components/settings/deleted-loans";
import { PageHeader } from "@/components/shared/page-header";
import { getSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Manage your account and review recent activity."
      />
      <SettingsForm
        initialFullName={session.user.name ?? ""}
        email={session.user.email ?? ""}
      />
      <DeletedLoans />
      <ActivityFeed
        embedded
        title="Activity"
        description="Your recent actions, loan updates, and sign-in history."
      />
    </div>
  );
}
