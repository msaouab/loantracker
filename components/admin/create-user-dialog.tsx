"use client";

import { useCallback, useState } from "react";
import { UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { useResetOnClose } from "@/hooks/use-reset-on-close";
import { createAdminUser } from "@/lib/admin-client";

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  isAdmin: false,
};

export function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateUserDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setError(null);
    setFieldErrors({});
  }, []);
  useResetOnClose(open, resetForm);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    if (form.fullName.trim().length < 2) {
      errors.fullName = "Full name is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email address";
    }
    if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createAdminUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        isAdmin: form.isAdmin,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create user"
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader className="text-left">
            <AlertDialogMedia className="bg-primary/10 text-primary">
              <UserPlus />
            </AlertDialogMedia>
            <AlertDialogTitle>Create user account</AlertDialogTitle>
            <AlertDialogDescription>
              Add a new manager or admin. The account is activated immediately and
              can sign in right away.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            {error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="create-full-name">Full name</Label>
              <Input
                id="create-full-name"
                value={form.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                autoComplete="name"
              />
              {fieldErrors.fullName ? (
                <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                autoComplete="email"
              />
              {fieldErrors.email ? (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <PasswordInput
                id="create-password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                autoComplete="new-password"
              />
              {fieldErrors.password ? (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-confirm-password">Confirm password</Label>
              <PasswordInput
                id="create-confirm-password"
                value={form.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="create-is-admin">Administrator</Label>
                <p className="text-sm text-muted-foreground">
                  Can manage users and access admin pages
                </p>
              </div>
              <Switch
                id="create-is-admin"
                checked={form.isAdmin}
                onCheckedChange={(checked) => updateField("isAdmin", checked)}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={creating}>
              Cancel
            </AlertDialogCancel>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create user"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
