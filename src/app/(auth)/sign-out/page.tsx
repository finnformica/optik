"use client";

import { signOut } from "@/app/(auth)/actions";
import { CircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#111827]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <CircleIcon className="size-12 text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Sign Out
        </h1>
        <p className="text-base text-gray-400">
          Are you sure you want to sign out of your account?
        </p>
        <div className="space-y-4">
          <form action={signOut}>
            <button
              type="submit"
              className="w-48 mx-auto flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Yes, Sign Out
            </button>
          </form>
          <button
            onClick={() => router.back()}
            className="w-48 mx-auto flex justify-center py-2 px-4 border border-gray-600 rounded-full shadow-sm text-sm font-medium text-white bg-[#1a2236] hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
