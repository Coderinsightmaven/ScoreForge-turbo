"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchVariant = "brand" | "warning";

type SwitchProps = Omit<React.ComponentPropsWithoutRef<"button">, "onChange"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  variant?: SwitchVariant;
};

const VARIANT_CLASSES: Record<SwitchVariant, string> = {
  brand: "data-[state=checked]:bg-brand data-[state=checked]:border-brand/40",
  warning: "data-[state=checked]:bg-warning data-[state=checked]:border-warning/40",
};

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, variant = "brand", className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group relative inline-flex h-6 w-11 items-center rounded-full border border-border/60 bg-bg-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full border border-border/70 bg-card shadow-[var(--shadow-sm)] transition-transform duration-200 ease-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
);

Switch.displayName = "Switch";

export { Switch };
