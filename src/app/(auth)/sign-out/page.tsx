"use client";

import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/global/logo";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#111827]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Sign Out
        </h1>
        <p className="text-base text-gray-400">
          Are you sure you want to sign out of your account?
        </p>
        <div className="space-y-4">
          <form action={signOut}>
            <button
              type="submit"
              className="mx-auto flex w-48 justify-center rounded-full border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              Yes, Sign Out
            </button>
          </form>
          <button
            onClick={() => router.back()}
            className="mx-auto flex w-48 justify-center rounded-full border border-gray-600 bg-[#1a2236] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
