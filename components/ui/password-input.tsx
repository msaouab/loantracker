"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { getPasswordMatchStatus, getPasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  showStrength?: boolean;
  matchWith?: string;
};

const strengthBorderStyles = {
  weak: "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:border-destructive/80",
  medium:
    "border-amber-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 dark:border-amber-400",
  strong:
    "border-emerald-600 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20 dark:border-emerald-500",
} as const;

const strengthTextStyles = {
  weak: "text-destructive",
  medium: "text-amber-600 dark:text-amber-400",
  strong: "text-emerald-600 dark:text-emerald-400",
} as const;

const matchBorderStyles = {
  match:
    "border-emerald-600 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20 dark:border-emerald-500",
  mismatch:
    "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:border-destructive/80",
} as const;

const matchTextStyles = {
  match: "text-emerald-600 dark:text-emerald-400",
  mismatch: "text-destructive",
} as const;

export function PasswordInput({
  className,
  showStrength = false,
  matchWith,
  onChange,
  value,
  id,
  ...props
}: PasswordInputProps) {
  const t = useTranslations("auth");
  const strengthId = useId();
  const matchId = useId();
  const [visible, setVisible] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const currentValue = value !== undefined ? String(value) : internalValue;
  const strength = showStrength ? getPasswordStrength(currentValue) : null;
  const matchStatus =
    matchWith !== undefined ? getPasswordMatchStatus(currentValue, matchWith) : null;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (value === undefined) {
      setInternalValue(event.target.value);
    }
    onChange?.(event);
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={handleChange}
          aria-describedby={
            strength ? strengthId : matchStatus ? matchId : props["aria-describedby"]
          }
          className={cn(
            "pe-10",
            strength && strengthBorderStyles[strength],
            matchStatus && matchBorderStyles[matchStatus],
            className
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 inset-e-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {strength ? (
        <p id={strengthId} className={cn("text-xs font-medium", strengthTextStyles[strength])}>
          {strength === "weak"
            ? t("passwordStrengthWeak")
            : strength === "medium"
              ? t("passwordStrengthMedium")
              : t("passwordStrengthStrong")}
        </p>
      ) : null}
      {matchStatus ? (
        <p id={matchId} className={cn("text-xs font-medium", matchTextStyles[matchStatus])}>
          {matchStatus === "match" ? t("passwordMatch") : t("passwordMismatch")}
        </p>
      ) : null}
    </div>
  );
}
