"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { Check, ShieldBan, Snowflake } from "lucide-react";
import { notifyError, notifySuccess } from "@/lib/toast";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
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
import { ACCOUNT_STATUS_LABELS } from "@/lib/users";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function StatusBadge({ status }: { status: AdminUser["status"] }) {
  if (status === "active") {
    return <Badge variant="secondary">{ACCOUNT_STATUS_LABELS.active}</Badge>;
  }
  if (status === "frozen") {
    return <Badge variant="destructive">{ACCOUNT_STATUS_LABELS.frozen}</Badge>;
  }
  return <Badge>{ACCOUNT_STATUS_LABELS.pending}</Badge>;
}

export function AdminUserProfile({ initialUser }: { initialUser: AdminUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [fullName, setFullName] = useState(initialUser.fullName);
  const [email, setEmail] = useState(initialUser.email);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
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
      notifySuccess("User profile updated");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors) {
        setProfileErrors(error.fieldErrors);
      } else {
        notifyError(error, "Failed to update user");
      }
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});

    const formData = new FormData(event.currentTarget);
    const payload = {
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    try {
      await resetAdminUserPassword(user.id, payload);
      notifySuccess("Password reset. The user will need to sign in again.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors) {
        setPasswordErrors(error.fieldErrors);
      } else {
        notifyError(error, "Failed to reset password");
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
          ? "User approved"
          : action === "freeze"
            ? "User frozen"
            : "User unfrozen"
      );
      router.refresh();
    } catch (error) {
      notifyError(error, "Failed to update user status");
    } finally {
      setActionUserId(null);
    }
  }

  const isBusy = actionUserId === user.id;

  return (
    <div className="space-y-4">
      <Card className="surface-card border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Status and access controls for this manager.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={user.status} />
            <span className="text-sm text-muted-foreground">
              Registered {format(new Date(user.createdAt), "MMM d, yyyy")}
            </span>
            <span className="text-sm text-muted-foreground">
              Last login{" "}
              {user.lastLoginAt
                ? format(new Date(user.lastLoginAt), "MMM d, yyyy h:mm a")
                : "Never"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.status === "pending" ? (
              <Button size="sm" disabled={isBusy} onClick={() => handleAction("approve")}>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Approve
              </Button>
            ) : null}
            {user.status === "active" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => handleAction("freeze")}
              >
                <Snowflake className="mr-1.5 h-3.5 w-3.5" />
                Freeze
              </Button>
            ) : null}
            {user.status === "frozen" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => handleAction("unfreeze")}
              >
                <ShieldBan className="mr-1.5 h-3.5 w-3.5" />
                Unfreeze
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="destructive"
              disabled={isBusy}
              onClick={() => setDeleteOpen(true)}
            >
              Remove user
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Edit this manager&apos;s name and email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
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
              <Label htmlFor="email">Email</Label>
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
              {profileLoading ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="surface-card border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Set a new password for this user. They will be signed out of all devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput id="newPassword" name="newPassword" minLength={8} required />
              <FieldError message={passwordErrors.newPassword?.[0]} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                minLength={8}
                required
              />
              <FieldError message={passwordErrors.confirmPassword?.[0]} />
            </div>

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Updating..." : "Reset password"}
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
          notifySuccess("User removed");
          router.push("/admin/users");
          router.refresh();
        }}
      />
    </div>
  );
}
