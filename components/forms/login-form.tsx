"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { notifyError, notifyInfo } from "@/lib/toast";

export function LoginForm({
  registered = false,
  passwordChanged = false,
}: {
  registered?: boolean;
  passwordChanged?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (registered) {
      notifyInfo(t("accountCreatedWait"));
    } else if (passwordChanged) {
      notifyInfo(t("passwordUpdatedSignIn"));
    }
  }, [registered, passwordChanged, t]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.code === "account_not_activated") {
        notifyError(null, t("accountPending"));
      } else if (result.code === "account_frozen") {
        notifyError(null, t("accountFrozen"));
      } else {
        notifyError(null, t("invalidCredentials"));
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{tCommon("email")}</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{tCommon("password")}</Label>
        <PasswordInput id="password" name="password" required />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
        />
        <Label htmlFor="rememberMe" className="font-normal">
          {t("rememberMe")}
        </Label>
      </div>

      <Button type="submit" className="h-10 w-full" size="lg" disabled={loading}>
        {loading ? t("signingIn") : t("signIn")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}
