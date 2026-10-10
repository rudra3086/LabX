import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftElement,
      rightElement,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-3 text-surface-400 pointer-events-none flex items-center">
              {leftElement}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-surface-400 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-transparent disabled:bg-surface-50 disabled:text-surface-400",
              leftElement && "pl-9",
              rightElement && "pr-9",
              error
                ? "border-rose-400 focus:ring-rose-500 text-rose-900"
                : "border-surface-300",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 text-surface-400 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-surface-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";