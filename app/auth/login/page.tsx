import { AuthCard } from "@/components/shared/auth-card";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard title="Welcome back" description="Sign in to your account">
      <LoginForm registered={params.registered === "true"} />
    </AuthCard>
  );
}
