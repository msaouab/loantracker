import { requireManagerOrRedirect } from "@/lib/session";

export default async function LoansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireManagerOrRedirect();
  return children;
}
