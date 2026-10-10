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
  "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-navy-800 text-white hover:bg-navy-900 active:bg-navy-950 focus:ring-navy-700 shadow-card",
  accent:
    "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 focus:ring-teal-600 shadow-card",
  secondary:
    "bg-surface-100 text-surface-800 hover:bg-surface-200 focus:ring-surface-400 border border-surface-200",
  outline:
    "border border-surface-300 text-surface-700 hover:bg-surface-50 focus:ring-navy-600 bg-white",
  ghost:
    "text-surface-600 hover:text-surface-900 hover:bg-surface-100 focus:ring-surface-300",
  destructive:
    "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-card",
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "text-[13px] px-2.5 py-1.5 gap-1.5 h-8",
  md: "text-sm px-3.5 py-2 gap-2 h-9",
  lg: "text-sm px-5 py-2.5 gap-2 h-10",
};

export type ButtonLikeProps = ButtonHTMLAttributes<HTMLButtonElement> &
  HTMLAttributes<HTMLElement> & {
    variant: ButtonVariant;
    size: ButtonSize;
    className: string;
  };