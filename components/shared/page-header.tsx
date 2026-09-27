import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export const PAGE_HEADER_ACTION_CLASS =
  "size-8 shrink-0 p-0 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3";

export const PAGE_HEADER_TOOLBAR_CLASS =
  "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5";

export function PageHeader({
  title,
  description,
  children,
  toolbar,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 p-4 sm:items-center sm:gap-4 sm:px-5 sm:py-2.5">
        <div className="min-w-0 space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children ? (
          <div className="flex shrink-0 flex-row flex-wrap gap-2">
            {children}
          </div>
        ) : null}
      </div>
      {toolbar ? (
        <>
          <Separator />
          {toolbar}
        </>
      ) : null}
    </div>
  );
}

type PageHeaderActionProps = {
  label: string;
  icon: LucideIcon;
  href?: string;
  /** Use a native anchor (no Next.js prefetch/router) — required for file downloads. */
  download?: boolean;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
} & Omit<React.ComponentProps<typeof Button>, "children" | "asChild">;

export function PageHeaderAction({
  label,
  icon: Icon,
  href,
  download = false,
  className,
  variant,
  ...props
}: PageHeaderActionProps) {
  const content = (
    <>
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </>
  );

  if (href && download) {
    return (
      <Button
        variant={variant}
        className={cn(PAGE_HEADER_ACTION_CLASS, className)}
        asChild
      >
        <a href={href} aria-label={label} download>
          {content}
        </a>
      </Button>
    );
  }

  if (href) {
    return (
      <Button
        variant={variant}
        className={cn(PAGE_HEADER_ACTION_CLASS, className)}
        asChild
      >
        <Link href={href} aria-label={label}>
          {content}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      aria-label={label}
      className={cn(PAGE_HEADER_ACTION_CLASS, className)}
      {...props}
    >
      {content}
    </Button>
  );
}
