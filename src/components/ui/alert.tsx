import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        success:
          "text-green-400 bg-green-900/20 border-green-600 [&>svg]:text-current *:data-[slot=alert-description]:text-green-200",
        warning:
          "text-yellow-400 bg-yellow-900/20 border-yellow-600 [&>svg]:text-current *:data-[slot=alert-description]:text-yellow-200",
        info:
          "text-blue-400 bg-blue-900/20 border-blue-600 [&>svg]:text-current *:data-[slot=alert-description]:text-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const getIcon = (variant: "default" | "destructive" | "success" | "warning" | "info" | null | undefined) => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="w-4 h-4" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4" />;
    case 'destructive':
      return <AlertCircle className="w-4 h-4" />;
    case 'info':
      return <Info className="w-4 h-4" />;
    case 'default':
    default:
      return <Info className="w-4 h-4" />;
  }
};

function Alert({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {getIcon(variant)}
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };
