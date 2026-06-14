import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  redirect(session.user.isAdmin ? "/admin/dashboard" : "/dashboard");
}
