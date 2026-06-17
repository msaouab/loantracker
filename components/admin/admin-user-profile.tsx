"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ShieldBan, Snowflake } from "lucide-react";
import { notifyError, notifySuccess } from "@/lib/toast";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { PresenceIndicator } from "@/components/admin/presence-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import {
  fetchAdminUser,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserProfile,
  type AdminUser,
} from "@/lib/admin-client";
import { ApiRequestError } from "@/lib/api-client";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";
import { isOnline } from "@/lib/presence";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function StatusBadge({
  status,
  labels,
}: {
  status: AdminUser["status"];
  labels: { active: string; frozen: string; pending: string };
}) {
  if (status === "active") {
    return <Badge variant="secondary">{labels.active}</Badge>;
  }
  if (status === "frozen") {
    return <Badge variant="destructive">{labels.frozen}</Badge>;
  }
  return <Badge>{labels.pending}</Badge>;
}

export function AdminUserProfile({ initialUser }: { initialUser: AdminUser }) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const statusLabels = {
    active: t("statusActive"),
    frozen: t("statusFrozen"),
    pending: t("statusPending"),
  };
  const [user, setUser] = useState(initialUser);
  const [fullName, setFullName] = useState(initialUser.fullName);
  const [email, setEmail] = useState(initialUser.email);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [newPassword, setNewPassword] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const profileDirty =
    fullName.trim() !== user.fullName.trim() || email.trim() !== user.email.trim();

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileLoading(true);
    setProfileErrors({});

    try {
      const updated = await updateAdminUserProfile(user.id, {
        fullName: fullName.trim(),
        email: email.trim(),
      });
      setUser(updated);
      setFullName(updated.fullName);
      setEmail(updated.email);
      notifySuccess(t("profileUpdated"));
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors) {
        setProfileErrors(error.fieldErrors);
      } else {
        notifyError(error, t("failedUpdateProfile"));
      }
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    try {
      await resetAdminUserPassword(user.id, payload);
      notifySuccess(t("passwordResetSuccess"));
      form.reset();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors) {
        setPasswordErrors(error.fieldErrors);
      } else {
        notifyError(error, t("failedResetPassword"));
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleAction(action: "approve" | "freeze" | "unfreeze") {
    setActionUserId(user.id);
    try {
      await updateAdminUser(user.id, action);
      const data = await fetchAdminUser(user.id);
      setUser(data.user);
      notifySuccess(
        action === "approve"
          ? t("userApproved")
          : action === "freeze"
            ? t("userFrozen")
            : t("userUnfrozen")
      );
      router.refresh();
    } catch (error) {
      notifyError(error, t("failedUpdateStatus"));
    } finally {
      setActionUserId(null);
    }
  }

  const isBusy = actionUserId === user.id;

  return (
    <div className="space-y-4">
      <Card className="surface-card border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>{t("accountTitle")}</CardTitle>
          <CardDescription>{t("accountDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={user.status} labels={statusLabels} />
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <PresenceIndicator lastSeenAt={user.lastSeenAt} />
              {isOnline(user.lastSeenAt)
                ? t("online")
                : user.lastSeenAt
                  ? t("lastSeen", { time: formatRelativeTime(user.lastSeenAt, locale) })
                  : t("offline")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("registered", {
                date: formatDate(user.createdAt, locale),
              })}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("lastLogin", {
                date: user.lastLoginAt
                  ? formatDateTime(user.lastLoginAt, locale)
                  : tc("never"),
              })}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.status === "pending" ? (
              <Button size="sm" disabled={isBusy} onClick={() => handleAction("approve")}>
                <Check className="me-1.5 h-3.5 w-3.5" />
                {tc("approve")}
              </Button>
            ) : null}
            {user.status === "active" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => handleAction("freeze")}
              >
                <Snowflake className="me-1.5 h-3.5 w-3.5" />
                {tc("freeze")}
              </Button>
            ) : null}
            {user.status === "frozen" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => handleAction("unfreeze")}
              >
                <ShieldBan className="me-1.5 h-3.5 w-3.5" />
                {tc("unfreeze")}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="destructive"
              disabled={isBusy}
              onClick={() => setDeleteOpen(true)}
            >
              {t("removeUser")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{tc("fullName")}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                minLength={2}
              />
              <FieldError message={profileErrors.fullName?.[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{tc("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <FieldError message={profileErrors.email?.[0]} />
            </div>

            <Button type="submit" disabled={profileLoading || !profileDirty}>
              {profileLoading ? tc("saving") : t("saveProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="surface-card border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>{t("passwordTitle")}</CardTitle>
          <CardDescription>{t("passwordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                minLength={8}
                required
                showStrength
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <FieldError message={passwordErrors.newPassword?.[0]} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                minLength={8}
                required
                matchWith={newPassword}
              />
              <FieldError message={passwordErrors.confirmPassword?.[0]} />
            </div>

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? tc("updating") : t("resetPassword")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        userId={user.id}
        fullName={user.fullName}
        onDeleted={() => {
          notifySuccess(t("userRemoved"));
          router.push("/admin/users");
          router.refresh();
        }}
      />
    </div>
  );
}
