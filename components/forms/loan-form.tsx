"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { todayDateParam } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { getOutstanding } from "@/lib/loans";
import { lookupClientName, type ClientLookupResult } from "@/lib/loans-client";
import type { AppLocale } from "@/lib/locale";
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
  enableClientLookup?: boolean;
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
  enableClientLookup = false,
}: LoanFormProps) {
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const [values, setValues] = useState(() => createInitialValues(initialValues));
  const [amountPaidInput, setAmountPaidInput] = useState(() => {
    const paid = createInitialValues(initialValues).amountPaid;
    return paid > 0 ? String(paid) : "";
  });
  const [loading, setLoading] = useState(false);
  const [clientLookup, setClientLookup] = useState<ClientLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const parsedAmountPaid =
    amountPaidInput.trim() === ""
      ? 0
      : Math.max(0, Math.round(Number(amountPaidInput) || 0));

  const outstanding = getOutstanding(values.totalAmount, parsedAmountPaid);
  const hasActiveDuplicate = clientLookup?.status === "active";
  const recoveredHint = clientLookup?.status === "recovered";

  useEffect(() => {
    if (!enableClientLookup) {
      setClientLookup(null);
      return;
    }

    const trimmed = values.clientName.trim();
    if (!trimmed) {
      setClientLookup(null);
      setLookupLoading(false);
      return;
    }

    setLookupLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await lookupClientName(trimmed);
        setClientLookup(result);
      } catch {
        setClientLookup(null);
      } finally {
        setLookupLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [enableClientLookup, values.clientName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasActiveDuplicate) {
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        ...values,
        amountPaid: parsedAmountPaid,
      });
    } catch (submitError) {
      notifyError(submitError, t("failedSave"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="clientName">{t("clientName")}</Label>
          <Input
            id="clientName"
            value={values.clientName}
            onChange={(event) =>
              setValues((current) => ({ ...current, clientName: event.target.value }))
            }
            aria-invalid={hasActiveDuplicate}
            aria-describedby={
              hasActiveDuplicate
                ? "clientName-error"
                : recoveredHint
                  ? "clientName-hint"
                  : undefined
            }
            required
          />
          {enableClientLookup && lookupLoading ? (
            <p className="text-xs text-muted-foreground">{tc("loading")}</p>
          ) : null}
          {hasActiveDuplicate ? (
            <p id="clientName-error" className="text-sm text-destructive">
              {t("clientNameActiveDuplicate")}
            </p>
          ) : null}
          {recoveredHint ? (
            <p id="clientName-hint" className="text-sm text-muted-foreground">
              {t("clientNameRecoveredHint")}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalAmount">{t("totalAmount")}</Label>
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
          <Label htmlFor="amountPaid">{t("amountPaid")}</Label>
          {amountPaidReadOnly ? (
            <>
              <Input
                id="amountPaid"
                value={formatCurrency(values.amountPaid, locale)}
                readOnly
                className="font-medium text-success"
              />
              <p className="text-xs text-muted-foreground">
                {t("amountPaidReadonly")}
              </p>
            </>
          ) : (
            <Input
              id="amountPaid"
              type="number"
              min="0"
              step="1"
              value={amountPaidInput}
              onChange={(event) => {
                const next = event.target.value;
                setAmountPaidInput(next);
                setValues((current) => ({
                  ...current,
                  amountPaid:
                    next.trim() === ""
                      ? 0
                      : Math.max(0, Math.round(Number(next) || 0)),
                }));
              }}
              placeholder="0"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="loanDate">{t("loanDate")}</Label>
          <DatePicker
            id="loanDate"
            value={values.loanDate}
            onChange={(loanDate) =>
              setValues((current) => ({ ...current, loanDate }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>{t("outstandingAmount")}</Label>
          <Input
            value={formatCurrency(outstanding, locale)}
            readOnly
            className="font-medium text-destructive"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{t("noteDescription")}</Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            rows={4}
          />
        </div>

        <label
          htmlFor="clientTrust"
          className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:col-span-2"
        >
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium">{t("clientTrust")}</span>
            <p className="text-sm text-muted-foreground">
              {t("clientTrustQuestion")}
            </p>
          </div>
          <Switch
            id="clientTrust"
            className="shrink-0"
            checked={values.clientTrust}
            onCheckedChange={(checked) =>
              setValues((current) => ({ ...current, clientTrust: checked }))
            }
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          className="w-full shadow-sm shadow-primary/20 sm:w-auto"
          disabled={loading || hasActiveDuplicate}
        >
          {loading ? tc("saving") : submitLabel}
        </Button>
        <Button variant="outline" className="w-full sm:w-auto" asChild>
          <Link href={cancelHref}>{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
