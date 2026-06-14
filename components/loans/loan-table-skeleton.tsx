import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { LoanSortField, LoanSortOrder } from "@/lib/loan-sort-types";

const SKELETON_ROWS = 10;

const SORTABLE_COLUMNS: { field: LoanSortField; label: string; className?: string }[] = [
  { field: "clientName", label: "Client" },
  { field: "totalAmount", label: "Total" },
  { field: "amountPaid", label: "Paid" },
  { field: "outstanding", label: "Outstanding" },
  { field: "loanDate", label: "Date" },
  { field: "clientTrust", label: "Trust" },
];

function SortableTableHead({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  label: string;
  field: LoanSortField;
  sortBy: LoanSortField;
  sortOrder: LoanSortOrder;
  onSort: (field: LoanSortField) => void;
  className?: string;
}) {
  const isActive = sortBy === field;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
        onClick={() => onSort(field)}
      >
        {label}
        {isActive ? (
          sortOrder === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function LoanTableSkeleton({ showRecoveredAt = false }: { showRecoveredAt?: boolean }) {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-10 rounded-md" />
          </TableCell>
          {showRecoveredAt ? (
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
          ) : null}
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function LoanTableShell({
  children,
  sortBy,
  sortOrder,
  onSort,
  showRecoveredAt = false,
}: {
  children: React.ReactNode;
  sortBy: LoanSortField;
  sortOrder: LoanSortOrder;
  onSort: (field: LoanSortField) => void;
  showRecoveredAt?: boolean;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 px-2" aria-label="Expand payment history" />
            {SORTABLE_COLUMNS.map((column) => (
              <SortableTableHead
                key={column.field}
                label={column.label}
                field={column.field}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
                className={column.className}
              />
            ))}
            {showRecoveredAt ? (
              <TableHead className="text-muted-foreground">Retention</TableHead>
            ) : null}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
      </div>
    </div>
  );
}
