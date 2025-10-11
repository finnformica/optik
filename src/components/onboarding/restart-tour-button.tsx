"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "./onboarding-provider";

export function RestartTourButton() {
  const { startOnboarding } = useOnboarding();

  return (
    <Button
      variant="outline"
      onClick={startOnboarding}
      className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
    >
      <HelpCircle className="w-4 h-4" />
      Take Tour
    </Button>
  );
}