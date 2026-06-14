import { redirect } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { getSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="app-shell min-h-screen">
      <Navbar
        userName={session.user.name}
        isAdmin={session.user.isAdmin}
      />
      <main className="mx-auto max-w-6xl px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}
