"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { todayDateParam } from "@/lib/dates";
import { formatCurrency, getOutstanding } from "@/lib/loans";
import { notifyError } from "@/lib/toast";

export type LoanFormValues = {
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  loanDate: string;
  description: string;
  clientTrust: boolean;
};

type LoanFormProps = {
  initialValues?: Partial<LoanFormValues>;
  submitLabel: string;
  onSubmit: (values: LoanFormValues) => Promise<void>;
  cancelHref: string;
  amountPaidReadOnly?: boolean;
};

function createInitialValues(initialValues?: Partial<LoanFormValues>): LoanFormValues {
  const base: LoanFormValues = {
    clientName: "",
    totalAmount: 0,
    amountPaid: 0,
    loanDate: "",
    description: "",
    clientTrust: false,
    ...initialValues,
  };

  if (!base.loanDate) {
    base.loanDate = todayDateParam();
  }

  return base;
}

export function LoanForm({
  initialValues,
  submitLabel,
  onSubmit,
  cancelHref,
  amountPaidReadOnly = false,
}: LoanFormProps) {
  const [values, setValues] = useState(() => createInitialValues(initialValues));
  const [loading, setLoading] = useState(false);

  const outstanding = getOutstanding(values.totalAmount, values.amountPaid);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      notifyError(submitError, "Failed to save loan");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            value={values.clientName}
            onChange={(event) =>
              setValues((current) => ({ ...current, clientName: event.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Amount</Label>
          <Input
            id="totalAmount"
            type="number"
            min="1"
            step="1"
            value={values.totalAmount || ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                totalAmount: Math.max(0, Math.round(Number(event.target.value) || 0)),
              }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amountPaid">Amount Paid</Label>
          {amountPaidReadOnly ? (
            <>
              <Input
                id="amountPaid"
                value={formatCurrency(values.amountPaid)}
                readOnly
                className="font-medium text-success"
              />
              <p className="text-xs text-muted-foreground">
                Record partial payments from the loan list to update this total.
              </p>
            </>
          ) : (
            <Input
              id="amountPaid"
              type="number"
              min="0"
              step="1"
              value={values.amountPaid || ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  amountPaid: Math.max(0, Math.round(Number(event.target.value) || 0)),
                }))
              }
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="loanDate">Loan Date</Label>
          <DatePicker
            id="loanDate"
            value={values.loanDate}
            onChange={(loanDate) =>
              setValues((current) => ({ ...current, loanDate }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Outstanding Amount</Label>
          <Input
            value={formatCurrency(outstanding)}
            readOnly
            className="font-medium text-destructive"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Note / Description</Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
          <div>
            <Label htmlFor="clientTrust">Client Trust</Label>
            <p className="text-sm text-muted-foreground">
              Is this client trustworthy?
            </p>
          </div>
          <Switch
            id="clientTrust"
            checked={values.clientTrust}
            onCheckedChange={(checked) =>
              setValues((current) => ({ ...current, clientTrust: checked }))
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" className="w-full shadow-sm shadow-primary/20 sm:w-auto" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        <Button variant="outline" className="w-full sm:w-auto" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
