"use client";

import { Star } from "lucide-react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md";
  mode?: "display" | "input";
  onChange?: (value: number) => void;
  className?: string;
};

export function StarRating({
  value,
  max = 5,
  size = "md",
  mode = "display",
  onChange,
  className
}: StarRatingProps) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const stars = useMemo(() => Array.from({ length: max }, (_, i) => i + 1), [max]);

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role={mode === "input" ? "radiogroup" : undefined}
      aria-label={mode === "display" ? `${value} out of ${max} stars` : "Rating"}
    >
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const interactive = mode === "input" && onChange;

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={cn(
              "rounded p-0.5 transition-colors",
              interactive && "cursor-pointer hover:scale-105 disabled:cursor-default",
              !interactive && "cursor-default"
            )}
            aria-label={interactive ? `${star} stars` : undefined}
            aria-pressed={interactive ? value === star : undefined}
          >
            <Star
              className={cn(
                iconClass,
                filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </span>
  );
}
