import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export const BUTTON_BASE =
  "inline-flex items-center justify-center font-semibold transition-colors rounded-fluent focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-navy-600 text-white hover:bg-navy-700 active:bg-navy-800 focus-visible:outline-navy-600",
  accent:
    "bg-navy-600 text-white hover:bg-navy-700 active:bg-navy-800 focus-visible:outline-navy-600",
  secondary:
    "bg-surface-100 text-surface-800 hover:bg-surface-200 focus-visible:outline-navy-600 border border-surface-200",
  outline:
    "border border-surface-300 text-surface-700 hover:bg-surface-100 focus-visible:outline-navy-600 bg-white",
  ghost:
    "text-surface-600 hover:text-surface-900 hover:bg-surface-100 focus-visible:outline-navy-600",
  destructive:
    "bg-[#C50F1F] text-white hover:bg-[#A80000] focus-visible:outline-[#C50F1F]",
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5 h-8",
  md: "text-base px-4 py-1.5 gap-2 h-10",
  lg: "text-base px-5 py-2 gap-2 h-11",
};

export type ButtonLikeProps = ButtonHTMLAttributes<HTMLButtonElement> &
  HTMLAttributes<HTMLElement> & {
    variant: ButtonVariant;
    size: ButtonSize;
    className: string;
  };