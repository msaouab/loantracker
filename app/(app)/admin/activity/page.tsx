import { getTranslations } from "next-intl/server";
import { ActivityFeed } from "@/components/activity/activity-feed";

export default async function AdminActivityPage() {
  const t = await getTranslations("admin");

  return (
    <ActivityFeed
      admin
      orgWide
      layout="table"
      title={t("activityTitle")}
      description={t("activityDescription")}
    />
  );
}
