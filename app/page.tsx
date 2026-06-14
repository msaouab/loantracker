import { redirect } from "next/navigation";
import { getSession, redirectToLogin } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session?.user) {
    return redirectToLogin();
  }

  redirect(session.user.isAdmin ? "/admin/dashboard" : "/dashboard");
}
