import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/core/lib/utils";

const progressRootVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-primary/20",
        success: "bg-green-100",
        error: "bg-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const progressIndicatorVariants = cva("h-full w-full flex-1 transition-all", {
  variants: {
    variant: {
      default: "bg-primary",
      success: "bg-green-600",
      error: "bg-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface ProgressProps
  extends
    React.ComponentProps<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressRootVariants> {}

function Progress({
  className,
  value,
  variant = "default",
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(progressRootVariants({ variant }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={progressIndicatorVariants({ variant })}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress, progressRootVariants, progressIndicatorVariants };
