"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DropdownSelectOption = {
  value: string;
  label: string;
};

type DropdownSelectProps = {
  value: string;
  options: DropdownSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  id?: string;
  "aria-label"?: string;
};

const EMPTY_VALUE = "__dropdown_select_empty__";

function toInternalValue(value: string) {
  return value === "" ? EMPTY_VALUE : value;
}

function toExternalValue(value: string) {
  return value === EMPTY_VALUE ? "" : value;
}

export function DropdownSelect({
  value,
  options,
  onValueChange,
  placeholder = "Select…",
  disabled,
  className,
  contentClassName,
  id,
  "aria-label": ariaLabel,
}: DropdownSelectProps) {
  const selected = options.find((option) => option.value === value);
  const label = selected?.label ?? placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "h-10 w-full min-w-0 justify-between gap-2 px-2.5 font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "max-h-72 w-(--radix-dropdown-menu-trigger-width)",
          contentClassName
        )}
      >
        <DropdownMenuRadioGroup
          value={toInternalValue(value)}
          onValueChange={(next) => onValueChange(toExternalValue(next))}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={toInternalValue(option.value)}
              value={toInternalValue(option.value)}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
