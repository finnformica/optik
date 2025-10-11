import { AccountLimitChecker } from "@/components/layout/account-limit-checker";
import BottomNavigation from "@/components/layout/bottom-navigation";
import Sidebar from "@/components/layout/sidebar";
import { OnboardingWrapper } from "@/components/onboarding";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Just ensure user is authenticated - components will handle their own account key needs
  await getAuthenticatedUser();

  return (
    <OnboardingWrapper>
      <Sidebar />
      <div className="h-screen w-screen md:py-2 md:pr-2">
        <main className="h-full overflow-x-clip overflow-y-scroll bg-[#111827] p-2 pb-20 md:ml-18 md:rounded-lg md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNavigation />
      <AccountLimitChecker />
    </OnboardingWrapper>
  );
}
