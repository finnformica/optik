import { paths } from "@/lib/utils";
import { CircleIcon } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#111827]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <CircleIcon className="size-12 text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-base text-gray-400">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          href={paths.home}
          className="max-w-48 mx-auto flex justify-center py-2 px-4 border border-gray-600 rounded-full shadow-sm text-sm font-medium text-white bg-[#1a2236] hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
