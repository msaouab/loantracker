"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMounted } from "@/hooks/use-mounted";
import {
  formatDateParam,
  isDayAfterMax,
  isDayBeforeMin,
  parseDateParam,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

type PickerVariant = "default" | "inline";

type SharedPickerProps = {
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  variant?: PickerVariant;
};

type DatePickerProps = SharedPickerProps & {
  value?: string;
  onChange: (value: string) => void;
};

function getTriggerClassName(variant: PickerVariant, hasValue: boolean, className?: string) {
  return cn(
    "h-9 min-w-0 justify-start font-normal",
    variant === "inline"
      ? "border-0 bg-transparent px-2.5 shadow-none hover:bg-muted/40"
      : "w-full border border-input bg-background px-3 shadow-xs hover:bg-background",
    !hasValue && "text-muted-foreground",
    className
  );
}

function DatePickerCalendar({
  selected,
  defaultMonth,
  min,
  max,
  onSelect,
}: {
  selected?: Date;
  defaultMonth?: Date;
  min?: string;
  max?: string;
  onSelect: (date: Date) => void;
}) {
  return (
    <Calendar
      mode="single"
      selected={selected}
      defaultMonth={defaultMonth ?? selected}
      onSelect={(date) => {
        if (date) {
          onSelect(date);
        }
      }}
      disabled={(date) => isDayBeforeMin(date, min) || isDayAfterMax(date, max)}
    />
  );
}

function PickerLabel({
  mounted,
  selected,
  placeholder,
  formatPattern,
}: {
  mounted: boolean;
  selected?: Date;
  placeholder: string;
  formatPattern: string;
}) {
  if (!selected || !mounted) {
    return placeholder;
  }

  return format(selected, formatPattern);
}

export function DatePicker({
  id,
  value = "",
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  min,
  max,
  className,
  variant = "default",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const mounted = useMounted();
  const selected = parseDateParam(value) ?? undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={getTriggerClassName(variant, Boolean(selected), className)}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          <span className="truncate" suppressHydrationWarning>
            <PickerLabel
              mounted={mounted}
              selected={selected}
              placeholder={placeholder}
              formatPattern="MMM d, yyyy"
            />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DatePickerCalendar
          selected={selected}
          min={min}
          max={max}
          onSelect={(date) => {
            onChange(formatDateParam(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
