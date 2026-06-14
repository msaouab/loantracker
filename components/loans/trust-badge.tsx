import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TrustBadgeProps = {
  trusted: boolean;
  label?: "short" | "long" | "none";
  className?: string;
};

export function TrustBadge({
  trusted,
  label = "short",
  className,
}: TrustBadgeProps) {
  const text =
    label === "none"
      ? null
      : label === "long"
        ? trusted
          ? "Trusted"
          : "Not trusted"
        : trusted
          ? "Yes"
          : "No";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        trusted ? "text-success" : "text-destructive",
        className,
      )}
    >
      {trusted ? (
        <Check className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <X className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {text}
    </span>
  );
}
