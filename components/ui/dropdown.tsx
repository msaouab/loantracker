"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { createElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DropdownOption = {
  value: string;
  label: ReactNode;
  icon?: LucideIcon;
};

type SharedProps = {
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  id?: string;
  "aria-label"?: string;
  align?: "start" | "end" | "center";
  trigger?: "text" | "icon";
  icon?: LucideIcon;
  matchTriggerWidth?: boolean;
};

export type DropdownSingleProps = SharedProps & {
  mode?: "single";
  value: string;
  onValueChange: (value: string) => void;
  getTriggerLabel?: (selected: DropdownOption | undefined) => ReactNode;
  getTriggerIcon?: (selected: DropdownOption | undefined) => LucideIcon | undefined;
};

export type DropdownMultipleProps = SharedProps & {
  mode: "multiple";
  values: string[];
  onValuesChange: (values: string[]) => void;
  clearLabel?: string;
  getTriggerLabel?: (selected: DropdownOption[]) => string;
};

export type DropdownProps =
  | DropdownSingleProps
  | DropdownMultipleProps;

const EMPTY_VALUE = "___dropdown_empty__";

function toInternalValue(value: string) {
  return value === "" ? EMPTY_VALUE : value;
}

function toExternalValue(value: string) {
  return value === EMPTY_VALUE ? "" : value;
}

function findOption(options: DropdownOption[], value: string) {
  return options.find((option) => option.value === value);
}

function renderOptionLabel(option: DropdownOption) {
  const Icon = option.icon;

  if (!Icon) {
    return option.label;
  }

  return (
    <>
      {createElement(Icon, { className: "me-2 h-4 w-4" })}
      {option.label}
    </>
  );
}

export function Dropdown(props: DropdownProps) {
  const {
    options,
    placeholder = "Select…",
    disabled,
    className,
    contentClassName,
    id,
    "aria-label": ariaLabel,
    align = "start",
    trigger = "text",
    icon: triggerIcon,
    matchTriggerWidth = trigger === "text",
  } = props;

  if (props.mode === "multiple") {
    const { values, onValuesChange, clearLabel, getTriggerLabel } = props;
    const selectedOptions = options.filter((option) => values.includes(option.value));
    const label = getTriggerLabel
      ? getTriggerLabel(selectedOptions)
      : selectedOptions.length === 0
        ? placeholder
        : selectedOptions.length === 1
          ? String(selectedOptions[0].label)
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
          align={align}
          className={cn(
            "max-h-72",
            matchTriggerWidth && "w-(--radix-dropdown-menu-trigger-width)",
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
              {renderOptionLabel(option)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const { value, onValueChange, getTriggerLabel, getTriggerIcon } = props;
  const selected = findOption(options, value);
  const label = getTriggerLabel ? getTriggerLabel(selected) : selected?.label ?? placeholder;
  const iconComponent =
    trigger === "icon" ? getTriggerIcon?.(selected) ?? triggerIcon : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger === "icon" && iconComponent ? (
          <Button
            id={id}
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "border-border/70 bg-background/80 backdrop-blur-sm",
              className
            )}
          >
            {createElement(iconComponent, { className: "h-4 w-4" })}
          </Button>
        ) : (
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
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn(
          "max-h-72",
          matchTriggerWidth && "w-(--radix-dropdown-menu-trigger-width)",
          !matchTriggerWidth && "min-w-36",
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
              {renderOptionLabel(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
