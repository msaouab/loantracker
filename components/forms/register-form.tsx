"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiRequestError } from "@/lib/api-client";
import { registerUser } from "@/lib/auth-client";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    try {
      await registerUser({
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        confirmPassword: String(formData.get("confirmPassword") ?? ""),
      });
      router.push("/auth/login?registered=true");
    } catch (submitError) {
      if (submitError instanceof ApiRequestError && submitError.fieldErrors) {
        setFieldErrors(submitError.fieldErrors);
      } else {
        setError(
          submitError instanceof Error ? submitError.message : "Registration failed"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" required />
        {fieldErrors.fullName?.[0] ? (
          <p className="text-sm text-destructive">{fieldErrors.fullName[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        {fieldErrors.email?.[0] ? (
          <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" minLength={8} required />
        {fieldErrors.password?.[0] ? (
          <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          minLength={8}
          required
        />
        {fieldErrors.confirmPassword?.[0] ? (
          <p className="text-sm text-destructive">{fieldErrors.confirmPassword[0]}</p>
        ) : null}
      </div>

      <Button type="submit" className="h-10 w-full" size="lg" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
