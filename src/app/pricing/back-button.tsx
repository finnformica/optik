"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const BackButton = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      variant="ghost"
      className="text-gray-400 hover:bg-gray-800 hover:text-white"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
};

export default BackButton;
