import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BUTTON_BASE,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  ButtonVariant,
  ButtonSize,
} from "./button-styles";

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  children,
  className,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
}