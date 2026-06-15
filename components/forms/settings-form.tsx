"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { notifyError, notifySuccess } from "@/lib/toast";
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
import { changePassword, updateProfile } from "@/lib/settings-client";
import { ApiRequestError } from "@/lib/api-client";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function SettingsForm({
  initialFullName,
  email,
}: {
  initialFullName: string;
  email: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileLoading(true);
    setProfileErrors({});

    try {
      await updateProfile(fullName);
      notifySuccess("Profile updated");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError && error.fieldErrors) {
        setProfileErrors(error.fieldErrors);
      } else {
        notifyError(error, "Failed to update profile");
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
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    try {
      await changePassword(payload);
      notifySuccess("Password changed. Please sign in again.");
      await signOut({ callbackUrl: "/auth/login?passwordChanged=true" });
    } catch (error) {
      setPasswordLoading(false);
      if (error instanceof ApiRequestError && error.fieldErrors) {
        setPasswordErrors(error.fieldErrors);
      } else {
        notifyError(error, "Failed to change password");
      }
    }
  }

  const profileDirty = fullName.trim() !== initialFullName.trim();

  return (
    <div className="space-y-4">
      <Card className="surface-card border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                minLength={2}
              />
              <FieldError message={profileErrors.fullName?.[0]} />
            </div>

            <Button type="submit" disabled={profileLoading || !profileDirty}>
              {profileLoading ? "Saving..." : "Save name"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="surface-card border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password. You will be signed out of all devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput id="currentPassword" name="currentPassword" required />
              <FieldError message={passwordErrors.currentPassword?.[0]} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput id="newPassword" name="newPassword" minLength={8} required />
              <FieldError message={passwordErrors.newPassword?.[0]} />
            </div>

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
              {passwordLoading ? "Updating..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
