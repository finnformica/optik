"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function FeatureCard({
  title,
  description,
  children,
  className = "",
  contentClassName = "h-64",
}: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "group hover:border-primary/50 hover:shadow-primary/10 overflow-hidden pt-6 transition-all duration-300 hover:shadow-lg",
        className
      )}
    >
      <CardHeader className="px-6 py-0">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn(contentClassName, "border-border/50 border-t")}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
