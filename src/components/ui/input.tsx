import * as React from "react";

import { cn } from "@/core/lib/utils";

type InputVariant = "default" | "lg";

interface InputProps extends React.ComponentProps<"input"> {
  variant?: InputVariant;
  containerClassName?: string;
  leftElement?: React.ReactNode;
  leftElementClassName?: string;
  rightElement?: React.ReactNode;
  rightElementClassName?: string;
}

function Input({
  className,
  containerClassName,
  type,
  variant = "default",
  leftElement,
  rightElement,
  leftElementClassName,
  rightElementClassName,
  ...props
}: InputProps) {
  return (
    <div
      className={cn("relative flex w-full items-center", containerClassName)}
    >
      {leftElement && (
        <div
          className={cn(
            "absolute left-2 flex items-center justify-center",
            leftElementClassName
          )}
        >
          {leftElement}
        </div>
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground dark:bg-input/10 disabled:dark:bg-input/80 border-input flex min-w-0 rounded-lg border bg-transparent px-3 text-base transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/10 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          "font-medium",

          // Variant styles
          "w-full",
          variant === "default" && "h-9 py-1 file:h-7",
          variant === "lg" && "h-10 px-4 py-2 file:h-10",

          // Padding adjustments for elements
          leftElement && "pl-10",
          rightElement && "pr-10",
          className
        )}
        {...props}
      />
      {rightElement && (
        <div
          className={cn(
            "absolute right-4 flex items-center justify-center",
            rightElementClassName
          )}
        >
          {rightElement}
        </div>
      )}
    </div>
  );
}

export { Input };
export type { InputProps };
