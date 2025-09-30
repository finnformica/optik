import { cn } from "@/lib/utils";
import { CircleIcon } from "lucide-react";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
  gutterBottom?: boolean;
}

export function Logo({
  size = "md",
  className,
  showText = false,
  gutterBottom = false,
}: LogoProps) {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const textSizeClasses = {
    xs: "text-lg",
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        className,
        gutterBottom && "mb-10",
      )}
    >
      <CircleIcon className={cn("text-blue-400", sizeClasses[size])} />
      {showText && (
        <span
          className={cn("text-foreground font-bold", textSizeClasses[size])}
        >
          Optik
        </span>
      )}
    </div>
  );
}
