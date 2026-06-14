import { Skeleton } from "@/components/ui/skeleton";

function PageHeaderSkeleton({ actions = 3 }: { actions?: number }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 sm:items-center sm:gap-4 sm:px-5 sm:py-2.5">
        <div className="min-w-0 space-y-1.5">
          <Skeleton className="h-6 w-48 sm:h-7" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex shrink-0 gap-2">
          {Array.from({ length: actions }).map((_, index) => (
            <Skeleton key={index} className="size-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoanDetailSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton actions={3} />

      <div className="surface-card grid gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-border/60 bg-muted/30 p-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-6 w-32" />
          </div>
        ))}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 sm:col-span-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-6 w-full max-w-md" />
        </div>
      </div>
    </div>
  );
}

export function LoanFormSkeleton() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton actions={0} />

      <div className="surface-card space-y-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
