import { ActivityFeed } from "@/components/activity/activity-feed";

export default function AdminActivityPage() {
  return (
    <ActivityFeed
      admin
      orgWide
      title="Admin Activity"
      description="Audit trail of actions performed across all user accounts."
    />
  );
}
