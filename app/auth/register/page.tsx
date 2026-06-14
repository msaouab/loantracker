import { AuthCard } from "@/components/shared/auth-card";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create account"
      description="Register your account. An admin must approve it before you can sign in."
    >
      <RegisterForm />
    </AuthCard>
  );
}
