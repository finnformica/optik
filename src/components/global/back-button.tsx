"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps extends ButtonProps {
  text?: string;
}

export function BackButton({ text = "Back", ...props }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => window.history.back()}
      {...props}
      className={cn(
        "text-muted-foreground hover:text-foreground",
        props.className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {text}
    </Button>
  );
}
