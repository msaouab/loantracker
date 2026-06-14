import { requireManagerOrRedirect } from "@/lib/session";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireManagerOrRedirect();
  return children;
}
