import { redirect } from "next/navigation";
import { AuthCard } from "@/components/shared/auth-card";
import { LoginForm } from "@/components/forms/login-form";
import { getSession } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; passwordChanged?: string }>;
}) {
  const session = await getSession();
  if (session?.user) {
    redirect(session.user.isAdmin ? "/admin/dashboard" : "/dashboard");
  }

  const params = await searchParams;

  return (
    <AuthCard title="Welcome back" description="Sign in to your account">
      <LoginForm
        registered={params.registered === "true"}
        passwordChanged={params.passwordChanged === "true"}
      />
    </AuthCard>
  );
}
