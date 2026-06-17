"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DropdownMultiSelectOption = {
  value: string;
  label: string;
};

type DropdownMultiSelectProps = {
  values: string[];
  options: DropdownMultiSelectOption[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  id?: string;
  "aria-label"?: string;
  getTriggerLabel?: (selected: DropdownMultiSelectOption[]) => string;
};

export function DropdownMultiSelect({
  values,
  options,
  onValuesChange,
  placeholder = "Select…",
  clearLabel,
  disabled,
  className,
  contentClassName,
  id,
  "aria-label": ariaLabel,
  getTriggerLabel,
}: DropdownMultiSelectProps) {
  const selectedOptions = options.filter((option) => values.includes(option.value));
  const label = getTriggerLabel
    ? getTriggerLabel(selectedOptions)
    : selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selected`;

  function toggle(value: string, checked: boolean) {
    if (checked) {
      onValuesChange([...values, value]);
      return;
    }

    onValuesChange(values.filter((item) => item !== value));
  }

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
            selectedOptions.length === 0 && "text-muted-foreground",
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
        {clearLabel ? (
          <>
            <DropdownMenuCheckboxItem
              checked={values.length === 0}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => {
                if (checked) {
                  onValuesChange([]);
                }
              }}
            >
              {clearLabel}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={values.includes(option.value)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => toggle(option.value, checked === true)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
